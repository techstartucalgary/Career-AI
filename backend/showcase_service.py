"""
Showcase mode service — runs a full demo cycle visible in real time:

  Greenhouse Boards API discovery → score → pick top match →
  extract fields → Playwright form fill (NO submit) →
  hold browser open → close.

Discovery uses a curated list of company slugs loaded from
backend/seed_assets/showcase_companies.json and the public
Greenhouse Boards API (no ScrapingDog needed).
"""
import asyncio
import base64
import json
import os
import tempfile
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bson import ObjectId

from database import col as users_col, applications_col
from models_application import ApplicationStatus, SubmitResult
from models_activity import ActivityEventType
from activity_emitter import emitter
from adapters import get_adapter

# ── Configuration ──────────────────────────────────────────────

SHOWCASE_MODE_ENABLED = os.getenv("SHOWCASE_MODE_ENABLED", "").lower() in ("true", "1", "yes")
SHOWCASE_HEADFUL = os.getenv("SHOWCASE_HEADFUL", "true").lower() in ("true", "1", "yes")
SHOWCASE_HOLD_SECONDS = int(os.getenv("SHOWCASE_HOLD_SECONDS", "8"))
SHOWCASE_BROWSER_X = int(os.getenv("SHOWCASE_BROWSER_X", "1280"))
SHOWCASE_BROWSER_Y = int(os.getenv("SHOWCASE_BROWSER_Y", "0"))

_BOARDS_API = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"

# Browser context settings (match apply_worker.py)
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1440, "height": 900}

# In-memory state for current showcase cycle per user
_active_cycles: Dict[str, dict] = {}

# Module-level warm browser — launched during warmup(), reused by run_showcase_cycle()
_warm_pw = None       # playwright instance
_warm_browser = None  # browser instance


# ── Helpers ────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_company_slugs() -> List[dict]:
    """Load curated company list from seed_assets."""
    path = Path(__file__).parent / "seed_assets" / "showcase_companies.json"
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"[showcase] Failed to load company slugs: {e}")
        return []


async def _fetch_greenhouse_board(
    client: httpx.AsyncClient,
    slug: str,
    display_name: str,
) -> List[Dict[str, Any]]:
    """Fetch all open jobs from one Greenhouse board."""
    url = _BOARDS_API.format(slug=slug)
    try:
        resp = await client.get(url, timeout=10)
        if resp.status_code != 200:
            return []
        data = resp.json()
        jobs = data.get("jobs", [])
        # Normalize to common format
        normalized = []
        for job in jobs:
            loc = job.get("location", {})
            normalized.append({
                "id": str(job.get("id", "")),
                "title": job.get("title", "Untitled"),
                "company": display_name,
                "company_slug": slug,
                "location": loc.get("name", "Location not listed") if isinstance(loc, dict) else str(loc),
                "apply_url": job.get("absolute_url", ""),
                "updated_at": job.get("updated_at", ""),
                "source": "greenhouse",
            })
        return normalized
    except Exception as e:
        print(f"[showcase] Failed to fetch board {slug}: {e}")
        return []


def _is_recent(job: dict, max_age_days: int = 14) -> bool:
    """Check if a job was updated within max_age_days."""
    updated = job.get("updated_at", "")
    if not updated:
        return True  # No date — assume recent
    try:
        dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - dt
        return age.total_seconds() < max_age_days * 86400
    except (ValueError, TypeError):
        return True


# ── Discovery ──────────────────────────────────────────────────

async def _search_all_greenhouse_boards(
    user_id: str,
    positions: List[str],
    location: str,
) -> List[Dict[str, Any]]:
    """
    Search all curated Greenhouse boards in parallel.
    Emits a jobs_discovered event per company (with pacing).
    """
    companies = _load_company_slugs()
    if not companies:
        return []

    # Fetch all boards in parallel
    async with httpx.AsyncClient() as client:
        tasks = [
            _fetch_greenhouse_board(client, c["slug"], c["display_name"])
            for c in companies
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    for i, result in enumerate(results):
        if isinstance(result, Exception) or not result:
            continue
        company_name = companies[i]["display_name"]
        count = len(result)
        all_jobs.extend(result)

        # Emit per-company with pacing
        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.jobs_discovered,
            title=f"Found {count} postings at {company_name}",
            payload={"company": company_name, "count": count},
        )
        await asyncio.sleep(0.25)  # 250ms between emissions

    return all_jobs


def _score_and_rank(
    jobs: List[Dict[str, Any]],
    positions: List[str],
    locations: List[str],
) -> List[Dict[str, Any]]:
    """Score jobs against user preferences using existing scoring logic."""
    from main import _annotate_job_fit

    scored = []
    for job in jobs:
        enriched, strict_gate, broad_key = _annotate_job_fit(
            job, positions, locations, [], "broad"
        )
        enriched.pop("_strict_gate", None)
        enriched.pop("_broad_key", None)
        scored.append(enriched)

    scored.sort(key=lambda j: -j.get("fit_score", 0))
    return scored


# ── Warmup ─────────────────────────────────────────────────────

async def warmup(user_id: str) -> dict:
    """
    Pre-fetch postings, pre-warm Playwright, pre-load profile.
    Returns status dict.
    """
    uid = ObjectId(user_id)
    result = {"profile_loaded": False, "playwright_warm": False, "jobs_cached": 0}
    cycle_state = _active_cycles.setdefault(user_id, {})

    # Load profile
    profile = users_col.find_one({"_id": uid}) if users_col is not None else None
    if profile:
        result["profile_loaded"] = True
        cycle_state["profile"] = profile

    # Pre-warm Playwright — launch browser and keep it alive for reuse
    global _warm_pw, _warm_browser
    try:
        from playwright.async_api import async_playwright

        launch_args = []
        if SHOWCASE_HEADFUL:
            launch_args = [
                f"--window-position={SHOWCASE_BROWSER_X},{SHOWCASE_BROWSER_Y}",
                "--window-size=1280,800",
            ]

        _warm_pw = await async_playwright().start()
        _warm_browser = await _warm_pw.chromium.launch(
            headless=not SHOWCASE_HEADFUL,
            args=launch_args,
        )
        result["playwright_warm"] = True
        print("[showcase] Playwright browser pre-launched and kept warm")
    except Exception as e:
        print(f"[showcase] Playwright warmup failed: {e}")
        _warm_pw = None
        _warm_browser = None

    # Pre-fetch Greenhouse jobs
    if profile:
        settings = profile.get("auto_apply_settings", {})
        positions = settings.get("positions", ["software engineer intern"])
        locations = settings.get("locations", ["Calgary"])
        location = locations[0] if locations else "Calgary"

        try:
            jobs = await _search_all_greenhouse_boards(user_id, positions, location)
            cycle_state["cached_jobs"] = jobs
            result["jobs_cached"] = len(jobs)
        except Exception as e:
            print(f"[showcase] Pre-fetch failed: {e}")

    return result


# ── Main Cycle ─────────────────────────────────────────────────

async def run_showcase_cycle(user_id: str) -> dict:
    """
    Full showcase cycle:
    1. Emit agent_started
    2. Load user profile
    3. Search Greenhouse boards (or use cached warmup)
    4. Filter to recent postings
    5. Score + rank
    6. Pick top match (try top 5 on failure — silent fallback)
    7. Extract fields, map profile
    8. Playwright fill (NO submit), with live screenshots
    9. Emit submission_ready
    10. Hold browser, then close
    """
    uid = ObjectId(user_id)
    cycle_state = _active_cycles.setdefault(user_id, {})
    cycle_state["status"] = "running"
    cycle_state["started_at"] = _now_iso()

    stats = {
        "jobs_found": 0,
        "recent_filtered": 0,
        "top_match": None,
        "fields_filled": 0,
        "total_fields": 0,
        "status": "running",
    }

    # ── 1. Emit start ──────────────────────────────────────
    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.agent_started,
        title="Showcase cycle started",
        description="Searching Greenhouse job boards...",
    )

    try:
        # ── 2. Load profile ────────────────────────────────
        profile = cycle_state.get("profile")
        if not profile:
            profile = users_col.find_one({"_id": uid}) if users_col is not None else None
        if not profile:
            raise ValueError("User profile not found")

        settings = profile.get("auto_apply_settings", {})
        positions = settings.get("positions", ["software engineer intern"])
        locations = settings.get("locations", ["Calgary"])
        location = locations[0] if locations else "Calgary"

        # ── 3. Search (use cache if available) ─────────────
        jobs = cycle_state.pop("cached_jobs", None)
        if not jobs:
            jobs = await _search_all_greenhouse_boards(user_id, positions, location)

        stats["jobs_found"] = len(jobs)

        if not jobs:
            raise ValueError("No Greenhouse postings found across any board.")

        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.jobs_discovered,
            title=f"Total: {len(jobs)} Greenhouse postings found",
            payload={"count": len(jobs)},
        )
        await asyncio.sleep(0.75)

        # ── 4. Filter to recent ────────────────────────────
        recent = [j for j in jobs if _is_recent(j)]
        stats["recent_filtered"] = len(recent)
        if not recent:
            recent = jobs  # If no recent ones, use all

        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.jobs_discovered,
            title=f"Filtered to {len(recent)} recent postings",
            payload={"count": len(recent)},
        )
        await asyncio.sleep(0.75)

        # ── 5. Score + rank ────────────────────────────────
        scored = _score_and_rank(recent, positions, locations)

        if not scored:
            raise ValueError("No postings matched your profile preferences.")

        await asyncio.sleep(1.0)  # pause before score reveal

        # Emit top 3
        for job in scored[:3]:
            emitter.emit(
                user_id=user_id,
                event_type=ActivityEventType.job_matched,
                title=f"Match: {job.get('title', 'Role')}",
                description=f"{job.get('company', '')} — {job.get('fit_score', 0):.0f}% fit",
                payload={
                    "title": job.get("title"),
                    "company": job.get("company"),
                    "fit_score": job.get("fit_score"),
                    "url": job.get("apply_url"),
                },
            )
            await asyncio.sleep(0.5)

        # ── 6. Pick top match, try top 5 with fallback ─────
        fill_success = False
        last_error = ""

        for idx, candidate in enumerate(scored[:5]):
            apply_url = candidate.get("apply_url", "")
            adapter = get_adapter(apply_url)
            if not adapter:
                continue

            stats["top_match"] = {
                "title": candidate.get("title"),
                "company": candidate.get("company"),
                "fit_score": candidate.get("fit_score"),
                "url": apply_url,
            }

            if idx > 0:
                emitter.emit(
                    user_id=user_id,
                    event_type=ActivityEventType.jobs_discovered,
                    title="Trying next match...",
                    description=f"{candidate.get('title')} at {candidate.get('company')}",
                )
                await asyncio.sleep(0.5)

            emitter.emit(
                user_id=user_id,
                event_type=ActivityEventType.job_matched,
                title=f"Selected: {candidate.get('title', 'Role')}",
                description=f"{candidate.get('company', '')} — {candidate.get('fit_score', 0):.0f}% fit",
                payload=stats["top_match"],
                severity="success",
            )

            # ── 7. Extract fields ──────────────────────────
            try:
                result = await _run_form_fill(
                    user_id=user_id,
                    profile=profile,
                    job=candidate,
                    adapter=adapter,
                    apply_url=apply_url,
                    cycle_state=cycle_state,
                    stats=stats,
                )
                if result:
                    fill_success = True
                    break
            except Exception as e:
                last_error = str(e)[:200]
                print(f"[showcase] Match #{idx+1} failed: {e}")
                traceback.print_exc()
                continue

        if not fill_success:
            raise ValueError(
                f"Could not fill any of the top matches. Last error: {last_error}"
            )

    except Exception as e:
        traceback.print_exc()
        stats["status"] = "error"
        stats["error"] = str(e)[:300]
        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.submission_failed,
            title="Showcase cycle encountered an issue",
            description=str(e)[:200],
            severity="warning",
        )

    # Final cleanup
    if stats["status"] != "error":
        stats["status"] = "completed"
    cycle_state["status"] = stats["status"]
    cycle_state["completed_at"] = _now_iso()

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.agent_stopped,
        title="Showcase cycle complete",
        payload=stats,
    )

    return stats


async def _run_form_fill(
    user_id: str,
    profile: dict,
    job: dict,
    adapter,
    apply_url: str,
    cycle_state: dict,
    stats: dict,
) -> bool:
    """
    Extract fields, open Playwright, fill form, take screenshots.
    Returns True on success, raises on failure.
    """
    from adapters.greenhouse import (
        _greenhouse_select,
        _field_id_for_name,
        _id_selector,
        _upload_file,
        _detect_captcha,
    )
    from adapters._helpers import safe_screenshot
    from field_detector import detect_meaning
    from field_mapper import map_field

    # ── Extract fields via API ─────────────────────────────
    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.extraction_started,
        title="Analyzing application form...",
        description=f"Extracting fields for {job.get('title')}",
    )

    fields = await adapter.extract_questions(apply_url)

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.extraction_completed,
        title=f"Found {len(fields)} form fields",
        payload={"total_fields": len(fields)},
    )
    stats["total_fields"] = len(fields)

    # ── Map profile to fields ──────────────────────────────
    tailored_docs = {
        "resume_b64": (profile.get("resume") or {}).get("file_data"),
        "cover_letter_text": None,
    }
    overrides = {
        "share_demographics": (profile.get("profile") or {}).get("share_demographics", False),
    }
    field_values: Dict[str, Any] = {}  # board_field_id -> value

    for field in fields:
        if not field.detected_meaning or field.detected_meaning == "unknown":
            meaning, confidence = detect_meaning(
                label=field.label,
                context={"field_type": field.field_type, "required": field.required},
                board="greenhouse",
            )
            field.detected_meaning = meaning

        mapped = map_field(
            field=field, profile=profile,
            job=job, tailored_docs=tailored_docs,
            overrides=overrides,
        )
        if mapped.source != "needs_user_input" and mapped.value is not None:
            key = field.board_field_id or field.label
            field_values[key] = mapped.value

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.tailoring_completed,
        title=f"Mapped {len(field_values)} fields from profile",
        payload={"auto_filled": len(field_values), "total": len(fields)},
    )

    # ── Open Playwright (reuse warm browser if available) ──
    global _warm_pw, _warm_browser

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.submission_started,
        title="Opening browser...",
        description=apply_url,
    )

    from playwright.async_api import async_playwright

    if _warm_browser and _warm_browser.is_connected():
        pw = _warm_pw
        browser = _warm_browser
        _warm_pw = None
        _warm_browser = None
        print("[showcase] Reusing pre-warmed browser")
    else:
        launch_args = []
        if SHOWCASE_HEADFUL:
            launch_args = [
                f"--window-position={SHOWCASE_BROWSER_X},{SHOWCASE_BROWSER_Y}",
                "--window-size=1280,800",
            ]

        pw = await async_playwright().start()
        browser = await pw.chromium.launch(
            headless=not SHOWCASE_HEADFUL,
            args=launch_args,
        )
        print("[showcase] Cold-launched browser (no warm instance available)")
    context = await browser.new_context(
        viewport=VIEWPORT,
        user_agent=USER_AGENT,
        locale="en-US",
        timezone_id="America/New_York",
    )
    page = await context.new_page()

    # Store browser refs for end_cycle
    cycle_state["browser"] = browser
    cycle_state["pw"] = pw

    resume_tmpfile = None

    try:
        # Navigate
        await page.goto(apply_url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        # Corporate redirect check
        current_host = urlparse(page.url).hostname or ""
        if current_host and "greenhouse.io" not in current_host:
            raise ValueError(f"Redirected to {current_host} — not a Greenhouse form")

        # CAPTCHA check — skip in showcase mode since we never submit.
        # reCAPTCHA only activates on form submission; filling fields is safe.
        # if await _detect_captcha(page):
        #     raise ValueError("CAPTCHA detected on this posting")

        # Click Apply button if needed
        for sel in [
            'a:has-text("Apply for this Job")',
            'a:has-text("Apply")',
            'button:has-text("Apply")',
            '#apply_button',
            'a[href*="application"]',
        ]:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await asyncio.sleep(2)
                    break
            except Exception:
                continue

        # Wait for form
        form_found = False
        for sel in [
            'form#application_form',
            'form[action*="/applications"]',
            'form[id*="application"]',
            '#application_form',
        ]:
            try:
                await page.wait_for_selector(sel, timeout=10000)
                form_found = True
                break
            except Exception:
                continue

        if not form_found:
            raise ValueError("Application form not found on page")

        # Prepare resume temp file
        resume_b64 = (profile.get("resume") or {}).get("file_data")
        if resume_b64:
            resume_tmpfile = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
            resume_tmpfile.write(base64.b64decode(resume_b64))
            resume_tmpfile.close()

        # ── Fill each field with screenshots ───────────────
        filled_count = 0

        for field in fields:
            name = field.board_field_id or ""
            label = field.label or name
            value = field_values.get(name) or field_values.get(label)

            if value is None:
                continue

            try:
                success = False

                if field.field_type == "file":
                    # Skip file uploads in showcase mode — resume upload
                    # takes ~2 min on Greenhouse and dominates cycle time.
                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.field_filled,
                        title=f"Resume (skipped in showcase mode)",
                        payload={"field": label, "skipped": True},
                    )
                    stats["resume_skipped"] = True
                    continue

                elif field.field_type in ("select", "multi_select"):
                    success = await _greenhouse_select(
                        page, name, str(value), field.options
                    )

                elif field.field_type == "checkbox":
                    if value and str(value).lower() not in ("false", "0", "no", ""):
                        fid = _field_id_for_name(name)
                        try:
                            await page.check(_id_selector(fid))
                            success = True
                        except Exception:
                            pass

                else:
                    # text / textarea
                    fid = _field_id_for_name(name)
                    for sel in [
                        _id_selector(fid),
                        f'input[name="{name}"]',
                        f'textarea[name="{name}"]',
                    ]:
                        try:
                            loc = page.locator(sel).first
                            if await loc.is_visible(timeout=2000):
                                await loc.fill(str(value))
                                success = True
                                break
                        except Exception:
                            continue

                if success:
                    filled_count += 1

                    # Take live screenshot after each field
                    try:
                        png = await page.screenshot(type="png", full_page=False)
                        b64 = base64.b64encode(png).decode("utf-8")
                    except Exception:
                        b64 = None

                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.field_filled,
                        title=f"Filled: {label}",
                        payload={"field": label},
                    )

                    if b64:
                        emitter.emit(
                            user_id=user_id,
                            event_type=ActivityEventType.screenshot_captured,
                            title=f"Screenshot after filling {label}",
                            payload={"b64_screenshot": b64},
                        )

                    await asyncio.sleep(0.4)  # 400ms pacing between fields

            except Exception as e:
                print(f"[showcase] Failed to fill {label}: {e}")

        stats["fields_filled"] = filled_count

        # ── Final screenshot ───────────────────────────────
        try:
            png = await page.screenshot(type="png", full_page=False)
            final_b64 = base64.b64encode(png).decode("utf-8")
        except Exception:
            final_b64 = None

        # ── Emit submission_ready ──────────────────────────
        resume_note = " (resume skipped in demo mode)" if stats.get("resume_skipped") else ""
        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.submission_ready,
            title=f"Application ready — {job.get('company')}, {job.get('title')}",
            description=f"Filled {filled_count}/{len(fields)} fields{resume_note}. Submission disabled in showcase mode.",
            payload={
                **stats,
                "b64_screenshot": final_b64,
            },
            severity="success",
        )

        # ── Hold browser open ──────────────────────────────
        cycle_state["status"] = "holding"
        hold_end = time.monotonic() + SHOWCASE_HOLD_SECONDS

        while time.monotonic() < hold_end:
            if cycle_state.get("status") == "ended":
                break
            await asyncio.sleep(1)

        return True

    finally:
        # Clean up temp file
        if resume_tmpfile:
            try:
                os.unlink(resume_tmpfile.name)
            except OSError:
                pass

        # Close browser
        try:
            await browser.close()
        except Exception:
            pass
        try:
            await pw.stop()
        except Exception:
            pass
        cycle_state.pop("browser", None)
        cycle_state.pop("pw", None)


# ── End Cycle ──────────────────────────────────────────────────

async def end_cycle(user_id: str) -> dict:
    """Close browser and reset state for the user."""
    cycle_state = _active_cycles.get(user_id, {})

    browser = cycle_state.get("browser")
    pw = cycle_state.get("pw")

    if browser:
        try:
            await browser.close()
        except Exception:
            pass

    if pw:
        try:
            await pw.stop()
        except Exception:
            pass

    cycle_state["status"] = "ended"
    _active_cycles.pop(user_id, None)

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.agent_stopped,
        title="Showcase ended",
        description="Browser closed, ready for next demo.",
    )

    return {"status": "ended"}


# ── Profile Readiness Check ───────────────────────────────────────

def check_profile_readiness(user_id: str) -> dict:
    """
    Check how complete a user's profile is for a showcase demo.
    Returns a readiness score (0-100) and lists of populated/missing fields.
    """
    uid = ObjectId(user_id)
    profile = users_col.find_one({"_id": uid}) if users_col is not None else None
    if not profile:
        return {"readiness_score": 0, "populated": [], "missing": ["profile not found"],
                "required_missing": ["profile not found"], "recommended_missing": []}

    p = profile.get("profile", {})
    resume = profile.get("resume", {})
    prefs = profile.get("job_preferences") or profile.get("auto_apply_settings") or {}
    extracted = (resume.get("extracted_data") or {})

    checks = {
        # Required fields (weight 10 each, 8 fields = 80 points max)
        "first_name": bool(p.get("first_name") or (p.get("display_name") or "").strip()),
        "last_name": bool(
            p.get("last_name") or len((p.get("display_name") or "").split()) > 1
        ),
        "email": bool(profile.get("email")),
        "phone": bool(p.get("phone")),
        "location": bool(p.get("location")),
        "citizenship_or_location_country": bool(
            profile.get("citizenship")
            or len((p.get("location") or "").split(",")) >= 2
        ),
        "resume": bool(resume.get("file_data")),
        "positions": bool(prefs.get("positions")),
        # Recommended fields (weight 4 each, 5 fields = 20 points max)
        "linkedin_url": bool(p.get("linkedin")),
        "github_url": bool(p.get("github")),
        "experience": bool(extracted.get("experience")),
        "education": bool(extracted.get("education")),
        "skills": bool(extracted.get("skills")),
    }

    required_keys = [
        "first_name", "last_name", "email", "phone",
        "location", "citizenship_or_location_country", "resume", "positions",
    ]
    recommended_keys = [
        "linkedin_url", "github_url", "experience", "education", "skills",
    ]

    required_score = sum(10 for k in required_keys if checks[k])
    recommended_score = sum(4 for k in recommended_keys if checks[k])
    score = required_score + recommended_score

    populated = [k for k, v in checks.items() if v]
    missing = [k for k, v in checks.items() if not v]

    return {
        "readiness_score": score,
        "populated": populated,
        "missing": missing,
        "required_missing": [k for k in required_keys if not checks[k]],
        "recommended_missing": [k for k in recommended_keys if not checks[k]],
    }
