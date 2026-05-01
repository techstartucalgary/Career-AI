"""
Phase 2: Dry-run submission test against live Greenhouse postings.

Opens each URL in Playwright, fills all fields from test profile + mapper,
takes a screenshot, and reports results. Does NOT click submit.
"""
import asyncio
import base64
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Mock database
import database
database.field_meanings_col = MagicMock()
database.field_meanings_col.find_one.return_value = None
database.field_meanings_col.update_one.return_value = None

from playwright.async_api import async_playwright

from adapters.greenhouse import (
    GreenhouseAdapter,
    parse_greenhouse_url,
    _greenhouse_select,
    _field_id_for_name,
    _id_selector,
    _upload_file,
)
from adapters._helpers import safe_screenshot
from field_mapper import map_field, MappedValue
from models_application import FormField


# ── Test profile ─────────────────────────────────────────────────

TEST_PROFILE = {
    "email": "test.applicant@example.com",
    "citizenship": "Canadian citizen",
    "work_authorization_status": "citizen",
    "profile": {
        "first_name": "Test",
        "last_name": "Applicant",
        "display_name": "Test Applicant",
        "phone": "555-555-5555",
        "location": "Calgary, AB, Canada",
        "linkedin": "https://linkedin.com/in/testapplicant",
        "github": "https://github.com/testapplicant",
        "website": "https://testapplicant.dev",
    },
    "resume": {
        "extracted_data": {
            "experience": [
                {"company": "Tech Corp", "title": "Software Engineer", "years": "2"},
            ],
            "education": [
                {
                    "school": "University of Calgary",
                    "degree": "BSc",
                    "field": "Computer Science",
                    "gpa": "3.7",
                    "graduation_date": "2028",
                }
            ],
        },
        "file_data": "placeholder",
    },
    "job_preferences": {"work_arrangement": "remote"},
}

# ── URLs to test ─────────────────────────────────────────────────

URLS = [
    ("Discord", "https://job-boards.greenhouse.io/discord/jobs/8371252002"),
    ("Stripe", "https://boards.greenhouse.io/stripe/jobs/7286376"),
    ("Anthropic", "https://boards.greenhouse.io/anthropic/jobs/4502508008"),
    ("Coinbase", "https://boards.greenhouse.io/coinbase/jobs/7843710"),
    ("Twitch", "https://boards.greenhouse.io/embed/job_app?token=8517748002"),
]

SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)


def mock_detect(label, context=None, board="generic"):
    """Rule-based field meaning detector for testing."""
    label_lower = label.lower().strip()
    rules = [
        ("first name", "first_name"), ("last name", "last_name"),
        ("preferred", "preferred_name"), ("full name", "full_name"),
        ("email", "email"), ("phone", "phone"),
        ("resume", "resume_upload"), ("cover letter", "cover_letter_upload"),
        ("linkedin", "linkedin_url"), ("github", "github_url"),
        ("website", "portfolio_url"), ("portfolio", "portfolio_url"),
        ("authorized to work", "work_auth_us"), ("work authorization", "work_auth_us"),
        ("legally authorized", "work_auth_us"), ("legally eligible", "work_auth_us"),
        ("sponsorship", "requires_sponsorship"), ("visa", "requires_sponsorship"),
        ("immigration", "requires_sponsorship"),
        ("gender", "gender"), ("race", "ethnicity"), ("ethnicity", "ethnicity"),
        ("veteran", "veteran_status"), ("disability", "disability_status"),
        ("hispanic", "hispanic_latino"), ("lgbtq", "unknown"),
        ("military", "veteran_status"),
        ("how did you hear", "how_did_you_hear"), ("referred", "referral_name"),
        ("why", "why_company"), ("tell us", "tell_us_about_yourself"),
        ("salary", "salary_expectation"), ("compensation", "salary_expectation"),
        ("additional", "additional_info"),
        ("agree", "agree_to_terms"), ("consent", "agree_to_terms"),
        ("start date", "start_date"), ("when can you start", "start_date"),
        ("earliest", "start_date"),
        ("years of experience", "years_experience"),
        ("school", "school_name"), ("university", "school_name"),
        ("degree", "degree"), ("gpa", "gpa"),
        ("current company", "current_company"), ("current employer", "current_company"),
        ("current title", "current_title"), ("current role", "current_title"),
        ("previous employer", "current_company"), ("previous job", "current_title"),
        ("relocat", "willing_to_relocate"),
        ("location", "location_city"), ("city", "location_city"),
        ("country", "location_country"), ("state", "location_state"),
        ("region", "location_country"),
    ]
    for keyword, meaning in rules:
        if keyword in label_lower:
            return (meaning, 0.90)
    return ("unknown", 0.50)


def create_dummy_resume():
    """Create a minimal valid PDF for upload testing."""
    content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
206
%%EOF"""
    fd, path = tempfile.mkstemp(suffix=".pdf", prefix="test_resume_")
    os.write(fd, content)
    os.close(fd)
    return path


async def dry_run_single(name, url, browser):
    """Run a dry-run submission test on a single posting."""
    print(f"\n{'='*70}")
    print(f"DRY-RUN: {name}")
    print(f"URL: {url}")
    start_time = time.monotonic()

    adapter = GreenhouseAdapter()
    result = {
        "name": name,
        "url": url,
        "form_rendered": False,
        "fields_total": 0,
        "fields_filled": 0,
        "fields_skipped": [],
        "required_empty": [],
        "select_tests": [],
        "file_uploads": [],
        "eeo_results": [],
        "screenshot": None,
        "errors": [],
        "duration_s": 0,
    }

    # Extract questions
    try:
        with patch("field_detector.detect_meaning", side_effect=mock_detect):
            fields = await adapter.extract_questions(url)
        result["fields_total"] = len(fields)
        print(f"  Extracted {len(fields)} fields")
    except Exception as e:
        result["errors"].append(f"Extraction failed: {e}")
        print(f"  FAIL extraction: {e}")
        return result

    # Create browser context
    context = await browser.new_context(
        viewport={"width": 1440, "height": 900},
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-US",
    )
    page = await context.new_page()

    try:
        # Navigate
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)
        print(f"  Page loaded: {page.url}")

        # Click Apply if needed
        apply_selectors = [
            'a:has-text("Apply for this Job")',
            'a:has-text("Apply")',
            'button:has-text("Apply")',
            '#apply_button',
        ]
        for sel in apply_selectors:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await asyncio.sleep(2)
                    print(f"  Clicked Apply button")
                    break
            except Exception:
                continue

        # Check form rendered
        form_selectors = [
            "form#application_form",
            'form[action*="/applications"]',
            'form[id*="application"]',
            "#application_form",
        ]
        for sel in form_selectors:
            try:
                await page.wait_for_selector(sel, timeout=10000)
                result["form_rendered"] = True
                print(f"  Form rendered OK")
                break
            except Exception:
                continue

        if not result["form_rendered"]:
            result["errors"].append("Form not found on page")
            print(f"  FAIL: form not found")
            # Take screenshot anyway
            ss = await safe_screenshot(page, "no_form")
            if ss:
                ss_path = SCREENSHOT_DIR / f"{name.lower()}_no_form.png"
                ss_path.write_bytes(base64.b64decode(ss))
                result["screenshot"] = str(ss_path)
            return result

        # Create dummy resume for uploads
        resume_path = create_dummy_resume()

        # Fill each field
        for field in fields:
            name_attr = field.board_field_id or ""
            label = field.label or name_attr
            is_eeo = field.board_specific_meta.get("is_eeo", False)

            # Map field value
            overrides = {"share_demographics": False}
            mapped = map_field(field, TEST_PROFILE, {}, {}, overrides)

            if mapped.source == "needs_user_input" and mapped.value is None:
                # For dry-run, fill with placeholder text for text/textarea
                if field.field_type in ("text", "textarea"):
                    mapped = MappedValue("Test response for dry run", "override", 0.5)
                elif field.field_type == "select" and field.options:
                    # Pick first option for testing
                    mapped = MappedValue(field.options[0], "override", 0.5)
                else:
                    result["fields_skipped"].append(label)
                    if field.required:
                        result["required_empty"].append(label)
                    continue

            value = mapped.value
            if value is None:
                result["fields_skipped"].append(label)
                if field.required:
                    result["required_empty"].append(label)
                continue

            # Fill based on type
            try:
                filled = False
                field_id = _field_id_for_name(name_attr)

                if field.field_type == "file":
                    # File upload
                    file_selectors = [
                        f'input[type="file"][id="{field_id}"]',
                        f'input[type="file"][name="{name_attr}"]',
                        f'input[type="file"][id*="{field_id}"]',
                        'input[type="file"]',
                    ]
                    for sel in file_selectors:
                        try:
                            loc = page.locator(sel).first
                            if await loc.count() > 0:
                                await loc.set_input_files(resume_path)
                                filled = True
                                result["file_uploads"].append({
                                    "label": label,
                                    "status": "set_files_ok",
                                })
                                break
                        except Exception as e:
                            result["file_uploads"].append({
                                "label": label,
                                "status": f"failed: {str(e)[:80]}",
                            })
                    if not filled:
                        result["file_uploads"].append({
                            "label": label,
                            "status": "input_not_found",
                        })

                elif field.field_type == "select":
                    success = await _greenhouse_select(
                        page, name_attr, str(value), field.options
                    )
                    filled = success
                    result["select_tests"].append({
                        "label": label,
                        "value": str(value),
                        "success": success,
                        "name_attr": name_attr,
                    })

                elif field.field_type == "multi_select":
                    # Just try the first value for testing
                    vals = [str(value)] if not isinstance(value, list) else value[:1]
                    success = await _greenhouse_select(
                        page, name_attr, vals[0], field.options
                    )
                    filled = success
                    result["select_tests"].append({
                        "label": label,
                        "value": str(vals[0]),
                        "success": success,
                        "name_attr": name_attr,
                    })

                elif field.field_type == "checkbox":
                    checkbox_selectors = [
                        _id_selector(field_id),
                        f'input[name="{name_attr}"]',
                    ]
                    for sel in checkbox_selectors:
                        try:
                            if await page.locator(sel).count() > 0:
                                await page.check(sel)
                                filled = True
                                break
                        except Exception:
                            continue
                    if not filled:
                        try:
                            await page.locator(f'label[for="{field_id}"]').first.click()
                            filled = True
                        except Exception:
                            pass

                else:  # text / textarea
                    text_selectors = [
                        _id_selector(field_id),
                        f'input[name="{name_attr}"]',
                        f'textarea[name="{name_attr}"]',
                    ]
                    for sel in text_selectors:
                        try:
                            loc = page.locator(sel).first
                            if await loc.is_visible(timeout=2000):
                                await loc.fill(str(value))
                                filled = True
                                break
                        except Exception:
                            continue

                if is_eeo:
                    result["eeo_results"].append({
                        "label": label,
                        "value": str(value),
                        "filled": filled,
                    })

                if filled:
                    result["fields_filled"] += 1
                else:
                    result["fields_skipped"].append(f"{label} (fill failed)")
                    if field.required:
                        result["required_empty"].append(label)

            except Exception as e:
                err = f"Error on '{label}': {str(e)[:100]}"
                result["errors"].append(err)
                if field.required:
                    result["required_empty"].append(label)

        # Take screenshot
        await asyncio.sleep(1)
        ss = await safe_screenshot(page, "before_submit")
        if ss:
            ss_path = SCREENSHOT_DIR / f"{name.lower()}_before_submit.png"
            ss_path.write_bytes(base64.b64decode(ss))
            result["screenshot"] = str(ss_path)
            print(f"  Screenshot: {ss_path}")

        # Clean up
        os.unlink(resume_path)

    except Exception as e:
        result["errors"].append(f"Unexpected error: {str(e)[:200]}")
        print(f"  ERROR: {e}")
    finally:
        await context.close()

    result["duration_s"] = round(time.monotonic() - start_time, 1)
    return result


async def main():
    print("Phase 2: Dry-Run Submission Test")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        results = []
        for name, url in URLS:
            r = await dry_run_single(name, url, browser)
            results.append(r)

            # Print per-URL summary
            print(f"\n  --- {name} Summary ---")
            print(f"  Form rendered: {r['form_rendered']}")
            print(f"  Fields: {r['fields_filled']}/{r['fields_total']} filled")
            print(f"  Required empty: {r['required_empty'] if r['required_empty'] else 'none'}")
            print(f"  Selects: {len([s for s in r['select_tests'] if s['success']])}/{len(r['select_tests'])} ok")
            print(f"  Files: {r['file_uploads']}")
            print(f"  EEO: {r['eeo_results']}")
            print(f"  Errors: {r['errors'] if r['errors'] else 'none'}")
            print(f"  Duration: {r['duration_s']}s")

        await browser.close()

    # Final summary
    print(f"\n{'='*70}")
    print("PHASE 2 OVERALL SUMMARY")
    print(f"{'='*70}")
    total_ok = sum(1 for r in results if r["form_rendered"] and not r["required_empty"])
    print(f"\nCompletely fillable: {total_ok}/{len(results)}")
    print()
    for r in results:
        status = "OK" if (r["form_rendered"] and not r["required_empty"]) else "ISSUES"
        sel_ok = len([s for s in r["select_tests"] if s["success"]])
        sel_total = len(r["select_tests"])
        print(f"  {r['name']:<12} {status:<8} filled={r['fields_filled']}/{r['fields_total']} sel={sel_ok}/{sel_total} req_empty={len(r['required_empty'])} errs={len(r['errors'])} {r['duration_s']}s")
        if r["required_empty"]:
            print(f"               Required empty: {r['required_empty']}")
        if r["errors"]:
            for e in r["errors"]:
                print(f"               Error: {e}")

    # Dump full results as JSON
    json_path = SCREENSHOT_DIR / "phase2_results.json"
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nFull results: {json_path}")


if __name__ == "__main__":
    asyncio.run(main())
