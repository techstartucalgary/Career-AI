"""
Greenhouse ATS adapter — extracts questions via the public Boards API
and submits applications via Playwright DOM interaction.

URL patterns:
  https://boards.greenhouse.io/{slug}/jobs/{id}
  https://job-boards.greenhouse.io/{slug}/jobs/{id}
  https://{company}.greenhouse.io/{anything}/jobs/{id}
  https://boards.greenhouse.io/embed/job_app?token={id}
  https://boards.greenhouse.io/embed/job_app?for={slug}&token={id}
  https://job-boards.greenhouse.io/embed/job_app?for={slug}&token={id}
"""
import asyncio
import re
import time
from datetime import datetime, timezone
from typing import Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs

import httpx

from adapters.base import BoardAdapter
from adapters.dispatcher import register_adapter
from adapters._helpers import retry_action, safe_screenshot, log_action
from models_application import FormField, SubmitResult
from models_activity import ActivityEventType

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None


# ── URL patterns ──────────────────────────────────────────────────

_URL_PATTERNS = [
    # boards.greenhouse.io/{slug}/jobs/{id}
    re.compile(r"https?://boards\.greenhouse\.io/([^/]+)/jobs/(\d+)", re.IGNORECASE),
    # job-boards.greenhouse.io/{slug}/jobs/{id}
    re.compile(r"https?://job-boards\.greenhouse\.io/([^/]+)/jobs/(\d+)", re.IGNORECASE),
    # {company}.greenhouse.io/{anything}/jobs/{id}
    re.compile(r"https?://([^.]+)\.greenhouse\.io/.*/jobs/(\d+)", re.IGNORECASE),
    # Catch-all with greenhouse.io
    re.compile(r"https?://[^/]*greenhouse\.io/([^/]+)/jobs/(\d+)", re.IGNORECASE),
]

_BOARDS_API = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{job_id}?questions=true"


# ── Errors ────────────────────────────────────────────────────────

class UnsupportedJobError(Exception):
    """Job no longer exists or wrong slug (404)."""
    pass


class TransientError(Exception):
    """Retryable server error (5xx)."""
    pass


class ParseError(Exception):
    """Unexpected API response shape."""
    pass


# ── Embed URL patterns ────────────────────────────────────────────

_EMBED_PATTERN = re.compile(
    r"https?://(?:boards|job-boards)\.greenhouse\.io/embed/job_app",
    re.IGNORECASE,
)


# ── URL parsing ───────────────────────────────────────────────────

def parse_greenhouse_url(url: str) -> Optional[Tuple[str, str]]:
    """
    Extract (company_slug, job_id) from a Greenhouse URL.

    Handles standard URLs, embedded application URLs, and the redirect
    format with ``for=`` query parameter.
    """
    # First try standard URL patterns
    for pattern in _URL_PATTERNS:
        m = pattern.search(url)
        if m:
            return (m.group(1), m.group(2))

    # Try embed format: /embed/job_app?token=ID  or  ?for=SLUG&token=ID
    if _EMBED_PATTERN.search(url):
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        token = params.get("token", [None])[0]
        slug = params.get("for", [None])[0]
        gh_jid = params.get("gh_jid", [None])[0]
        job_id = token or gh_jid
        if job_id:
            if slug:
                return (slug, job_id)
            # No slug in URL — resolve by following the redirect
            slug = _resolve_embed_slug(url)
            if slug:
                return (slug, job_id)
    return None


def _resolve_embed_slug(url: str) -> Optional[str]:
    """
    Resolve the company slug from an embed URL by following the redirect.

    Greenhouse embed URLs without ``for=`` redirect to a canonical URL
    that includes ``for=SLUG`` in the query string.
    """
    try:
        resp = httpx.head(url, follow_redirects=False, timeout=10)
        if resp.status_code in (301, 302, 303, 307):
            location = resp.headers.get("location", "")
            parsed = urlparse(location)
            params = parse_qs(parsed.query)
            slug = params.get("for", [None])[0]
            if slug:
                return slug
    except Exception as e:
        print(f"[greenhouse] Failed to resolve embed slug for {url}: {e}")
    return None


# ── Field type mapping ────────────────────────────────────────────

_GH_TYPE_MAP = {
    "input_text": "text",
    "input_file": "file",
    "textarea": "textarea",
    "multi_value_single_select": "select",
    "multi_value_multi_select": "multi_select",
    "input_hidden": "unknown",
    "boolean": "checkbox",
}


def _parse_question(question: dict, is_eeo: bool = False) -> Optional[FormField]:
    """Parse a single Greenhouse API question into a FormField.

    Handles two API formats:
      - Standard: question.fields[0] has {name, type, values}
      - Demographic (v2): question has {type, answer_options} at top level
    """
    fields = question.get("fields") or []

    if fields:
        # Standard format
        field_def = fields[0]
        gh_type = field_def.get("type", "input_text")
        field_type = _GH_TYPE_MAP.get(gh_type, "unknown")

        values = field_def.get("values") or []
        options = [v.get("label", str(v.get("value", ""))) for v in values] if values else None
        board_field_id = field_def.get("name", "")
    elif question.get("answer_options") is not None:
        # Demographic v2 format: type and answer_options at question level
        gh_type = question.get("type", "multi_value_single_select")
        field_type = _GH_TYPE_MAP.get(gh_type, "select")
        answer_opts = question.get("answer_options") or []
        options = [ao.get("label", "") for ao in answer_opts if ao.get("label")]
        board_field_id = f"demographic_{question.get('id', '')}"
    else:
        return None

    board_meta = {
        "greenhouse_question_id": question.get("id"),
        "is_eeo": is_eeo,
    }
    if is_eeo:
        board_meta["eeo_type"] = question.get("type")

    return FormField(
        selector=None,  # Will be determined during form fill
        board_field_id=board_field_id,
        field_type=field_type,
        label=question.get("label", ""),
        required=question.get("required", False),
        options=options,
        max_length=None,
        detected_meaning=None,  # Set by field_detector later
        board_specific_meta=board_meta,
    )


# ── React-Select / native select handler ─────────────────────────

def _field_id_for_name(name: str) -> str:
    """Derive the DOM element ID from a Greenhouse board_field_id.

    Standard fields  : 'first_name'            → 'first_name'
    Custom questions : 'question_12345'         → 'question_12345'
    Demographics     : 'demographic_12345'      → '12345'
                       (Greenhouse renders EEO inputs with just the numeric ID)
    Array fields     : 'question_12345[]'       → 'question_12345'
    """
    clean = name.rstrip("[]")
    # Demographic fields: DOM uses just the numeric ID, not "demographic_" prefix
    if clean.startswith("demographic_"):
        return clean[len("demographic_"):]
    return clean


def _id_selector(field_id: str) -> str:
    """Build a CSS selector for an element by its ID.

    CSS ``#`` selectors cannot start with a digit, so numeric-only IDs
    (common for Greenhouse EEO fields) use the attribute form instead.
    """
    if field_id and field_id[0:1].isdigit():
        return f'[id="{field_id}"]'
    return f"#{field_id}"


async def _greenhouse_select(
    page,
    name: str,
    value: str,
    options: Optional[List[str]] = None,
    application_id: str = "",
) -> bool:
    """
    Handle Greenhouse React-Select dropdowns (new UI) **and** native <select>.

    Greenhouse's current application forms use React-Select, which renders
    as ``<input role="combobox" aria-haspopup="true">`` inside a wrapper
    with ``class*="select__control"``. Selecting an option: click the input
    → ``.select__menu`` opens → click the matching ``.select__option``.

    Falls back to native ``<select>`` if found.
    """
    start = time.monotonic()
    field_id = _field_id_for_name(name)

    # Normalize boolean-like values to Yes/No
    if value.lower() in ("true", "false"):
        value = "Yes" if value.lower() == "true" else "No"

    # ── 1. Locate the input element ─────────────────────────────
    # Multi-select fields keep [] in their DOM ID (e.g. "question_123[]")
    trigger_selectors = [
        _id_selector(field_id),
        f'[id="{name}"]',            # try original name including []
        f'[name="{name}"]',
        f'[name="{field_id}"]',
    ]

    trigger = None
    is_native_select = False
    is_combobox = False

    for sel in trigger_selectors:
        try:
            loc = page.locator(sel).first
            if await loc.is_visible(timeout=1500):
                tag = await loc.evaluate("el => el.tagName.toLowerCase()")
                if tag == "select":
                    is_native_select = True
                    trigger = loc
                    break
                role = await loc.get_attribute("role") or ""
                if role == "combobox" or tag == "input":
                    is_combobox = True
                trigger = loc
                break
        except Exception:
            continue

    if trigger is None:
        log_action(application_id, "select_open", name, "trigger_not_found")
        return False

    # ── 2. Native <select> path ─────────────────────────────────
    if is_native_select:
        try:
            await trigger.select_option(label=value)
            log_action(application_id, "native_select", name, "ok",
                       int((time.monotonic() - start) * 1000))
            return True
        except Exception:
            try:
                await trigger.select_option(value=value)
                return True
            except Exception as e:
                log_action(application_id, "native_select", name, f"failed: {e}")
                return False

    # ── 3. React-Select path ────────────────────────────────────
    # Click the input (or its wrapping container) to open the menu
    try:
        await trigger.click()
        await asyncio.sleep(0.4)
    except Exception as e:
        log_action(application_id, "react_select_open", name, f"click_failed: {e}")
        return False

    # Type to filter options (React-Select supports type-to-search)
    if is_combobox:
        try:
            search_term = value[:50]
            await trigger.fill(search_term)
            await asyncio.sleep(0.5)
        except Exception:
            # Some comboboxes don't accept fill — use press_sequentially
            try:
                await trigger.press_sequentially(value[:30], delay=30)
                await asyncio.sleep(0.5)
            except Exception:
                pass

    # ── 4. Wait for menu and find options ───────────────────────
    option_selectors = [
        ".select__option",              # React-Select default class
        '[class*="option"]',            # fallback partial class match
        "li.select2-results__option",   # legacy Select2
    ]

    option_elements = None
    for sel in option_selectors:
        try:
            await page.wait_for_selector(sel, timeout=3000)
            option_elements = page.locator(sel)
            count = await option_elements.count()
            if count > 0:
                break
        except Exception:
            continue

    if option_elements is None or await option_elements.count() == 0:
        log_action(application_id, "react_select_options", name, "no_options_found")
        await page.keyboard.press("Escape")
        return False

    # ── 5. Fuzzy-match the best option ──────────────────────────
    count = await option_elements.count()
    best_score = 0
    best_idx = 0

    for i in range(count):
        try:
            text = (await option_elements.nth(i).text_content() or "").strip()
            if not text:
                continue

            if text.lower() == value.lower():
                best_idx = i
                best_score = 100
                break

            if fuzz:
                score = fuzz.token_set_ratio(value.lower(), text.lower())
            else:
                score = 100 if value.lower() in text.lower() else 0

            if score > best_score:
                best_score = score
                best_idx = i
        except Exception:
            continue

    if best_score < 50:
        log_action(application_id, "react_select_match", name,
                   f"no_match (best={best_score})", extra={"value": value})
        await page.keyboard.press("Escape")
        return False

    # ── 6. Click the matched option ─────────────────────────────
    try:
        await option_elements.nth(best_idx).click()
        await asyncio.sleep(0.3)
        elapsed = int((time.monotonic() - start) * 1000)
        log_action(application_id, "react_select", name, "ok", elapsed,
                   extra={"score": str(best_score)})
        return True
    except Exception as e:
        log_action(application_id, "react_select", name, f"click_failed: {e}")
        await page.keyboard.press("Escape")
        return False


async def _greenhouse_multi_select(
    page,
    name: str,
    values: List[str],
    application_id: str = "",
) -> bool:
    """Handle multi-select by selecting each value without closing between."""
    success = True
    for val in values:
        if not await _greenhouse_select(page, name, val, application_id=application_id):
            success = False
    return success


# ── File upload handler ───────────────────────────────────────────

async def _upload_file(
    page,
    name: str,
    file_path: str,
    application_id: str = "",
) -> bool:
    """Upload a file and wait for Greenhouse's success indicator."""
    start = time.monotonic()

    # Find the file input
    fid = _field_id_for_name(name)
    selectors = [
        f'input[type="file"][id="{fid}"]',
        f'input[type="file"][name="{name}"]',
        f'input[type="file"][id*="{fid}"]',
        'input[type="file"][name*="resume"]',
        'input[type="file"][name*="cover_letter"]',
        'input[type="file"]',
    ]

    file_input = None
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if await loc.count() > 0:
                file_input = loc
                break
        except Exception:
            continue

    if file_input is None:
        log_action(application_id, "file_upload", name, "input_not_found")
        return False

    try:
        await file_input.set_input_files(file_path)
    except Exception as e:
        log_action(application_id, "file_upload", name, f"set_files_failed: {e}")
        return False

    # Wait for upload confirmation (Greenhouse shows filename or checkmark)
    confirmation_selectors = [
        ".attachment-filename",
        ".upload-complete",
        ".filename",
        f'[data-field="{name}"] .attachment',
    ]

    for sel in confirmation_selectors:
        try:
            await page.wait_for_selector(sel, timeout=30000)
            elapsed = int((time.monotonic() - start) * 1000)
            log_action(application_id, "file_upload", name, "ok", elapsed)
            return True
        except Exception:
            continue

    # No explicit confirmation found, but file was set — assume success
    elapsed = int((time.monotonic() - start) * 1000)
    log_action(application_id, "file_upload", name, "set_no_confirm", elapsed)
    return True


# ── CAPTCHA detection ─────────────────────────────────────────────

async def _detect_captcha(page) -> bool:
    """Check for CAPTCHA iframes on the page."""
    for sel in [
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]',
        'iframe[src*="challenges.cloudflare.com"]',
        '.g-recaptcha',
        '[data-sitekey]',
    ]:
        try:
            if await page.locator(sel).count() > 0:
                return True
        except Exception:
            continue
    return False


# ── Confirmation detection ────────────────────────────────────────

async def _detect_confirmation(page, timeout: int = 30000) -> Optional[Dict]:
    """
    After clicking submit, race to detect:
    1. Success (URL change or success div)
    2. Validation error
    3. CAPTCHA

    Returns dict with 'outcome': 'success'|'validation_error'|'captcha'
    """
    deadline = time.monotonic() + (timeout / 1000)

    while time.monotonic() < deadline:
        # Check URL for success indicators
        current_url = page.url
        if any(kw in current_url.lower() for kw in ["thanks", "confirmation", "success", "thank-you"]):
            return {
                "outcome": "success",
                "url": current_url,
                "text": await _extract_confirmation_text(page),
            }

        # Check for success div
        success_selectors = [
            "div.application-confirmation",
            'h1:has-text("Thank you")',
            'h1:has-text("Thanks")',
            'div:has-text("received your application")',
            "#application_confirmation",
        ]
        for sel in success_selectors:
            try:
                loc = page.locator(sel).first
                if await loc.is_visible(timeout=500):
                    return {
                        "outcome": "success",
                        "url": current_url,
                        "text": await _extract_confirmation_text(page),
                    }
            except Exception:
                continue

        # Check for validation errors
        error_selectors = [
            ".field_error",
            ".error-message",
            '[aria-invalid="true"]',
            ".field_with_errors",
            ".error",
        ]
        for sel in error_selectors:
            try:
                locs = page.locator(sel)
                if await locs.count() > 0:
                    msgs = []
                    for i in range(min(await locs.count(), 5)):
                        text = await locs.nth(i).text_content()
                        if text and text.strip():
                            msgs.append(text.strip())
                    if msgs:
                        return {
                            "outcome": "validation_error",
                            "errors": msgs,
                        }
            except Exception:
                continue

        # Check for CAPTCHA
        if await _detect_captcha(page):
            return {"outcome": "captcha"}

        await asyncio.sleep(0.5)

    return {"outcome": "timeout"}


async def _extract_confirmation_text(page) -> str:
    """Extract confirmation text from the success page."""
    selectors = [
        "div.application-confirmation",
        "#application_confirmation",
        "main",
        "body",
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if await loc.is_visible(timeout=1000):
                text = (await loc.text_content() or "").strip()
                return text[:500] if text else ""
        except Exception:
            continue
    return ""


# ── Main adapter class ────────────────────────────────────────────

class GreenhouseAdapter(BoardAdapter):
    """Full Greenhouse ATS adapter."""

    def matches(self, url: str) -> bool:
        # Fast check: standard patterns OR embed pattern
        for pattern in _URL_PATTERNS:
            if pattern.search(url):
                return True
        if _EMBED_PATTERN.search(url):
            return True
        return False

    async def extract_questions(self, url: str) -> List[FormField]:
        """
        Extract form fields using the Greenhouse public Boards API.
        No browser needed — pure HTTP.
        """
        parsed = parse_greenhouse_url(url)
        if not parsed:
            raise UnsupportedJobError(f"Cannot parse Greenhouse URL: {url}")

        slug, job_id = parsed
        api_url = _BOARDS_API.format(slug=slug, job_id=job_id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(api_url)

        if resp.status_code == 404:
            raise UnsupportedJobError(
                f"Greenhouse job not found: {slug}/{job_id} (404)"
            )
        if resp.status_code >= 500:
            raise TransientError(
                f"Greenhouse API server error: {resp.status_code}"
            )
        if resp.status_code != 200:
            raise ParseError(
                f"Unexpected Greenhouse API status: {resp.status_code}"
            )

        try:
            data = resp.json()
        except Exception as e:
            raise ParseError(f"Invalid JSON from Greenhouse API: {e}")

        fields: List[FormField] = []

        # Parse standard questions
        questions = data.get("questions") or []
        for q in questions:
            field = _parse_question(q, is_eeo=False)
            if field:
                fields.append(field)

        # Parse demographic (EEO) questions — can be a list or a dict
        demo_raw = data.get("demographic_questions")
        if isinstance(demo_raw, list):
            demo_questions = demo_raw
        elif isinstance(demo_raw, dict):
            demo_questions = demo_raw.get("questions") or []
        else:
            demo_questions = []
        for q in demo_questions:
            field = _parse_question(q, is_eeo=True)
            if field:
                fields.append(field)

        # Run field meaning detection on each field
        from field_detector import detect_meaning

        for field in fields:
            meaning, confidence = detect_meaning(
                label=field.label,
                context={
                    "field_type": field.field_type,
                    "required": field.required,
                    "is_eeo": field.board_specific_meta.get("is_eeo", False),
                },
                board="greenhouse",
            )
            field.detected_meaning = meaning

        return fields

    async def submit_application(
        self,
        page,
        url: str,
        profile: dict,
        answers: dict,
        resume_path: Optional[str] = None,
        cover_letter_path: Optional[str] = None,
        emit_progress: Optional[Callable] = None,
    ) -> SubmitResult:
        """
        Fill and submit a Greenhouse application form via Playwright.
        """
        app_id = "gh"  # Will be overridden if available
        share_demographics = (profile.get("_overrides") or {}).get("share_demographics", False)

        async def _emit(event_type, title, description="", payload=None):
            if emit_progress:
                await emit_progress(event_type, title, description, payload)

        # ── Navigate ───────────────────────────────────────────
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)
        except Exception as e:
            screenshot = await safe_screenshot(page, "navigation_error")
            return SubmitResult(
                success=False,
                error=f"Failed to load page: {str(e)[:200]}",
                error_class="navigation",
                screenshot_path=screenshot,
            )

        # ── Corporate redirect detection ────────────────────────
        current_host = urlparse(page.url).hostname or ""
        if current_host and "greenhouse.io" not in current_host:
            screenshot = await safe_screenshot(page, "corporate_redirect")
            return SubmitResult(
                success=False,
                error=(
                    f"This company embeds Greenhouse in their career page at "
                    f"{current_host}. Apply manually via {page.url}"
                ),
                error_class="corporate_redirect",
                screenshot_path=screenshot,
            )

        # ── CAPTCHA check ──────────────────────────────────────
        if await _detect_captcha(page):
            screenshot = await safe_screenshot(page, "captcha")
            return SubmitResult(
                success=False,
                error="CAPTCHA detected on application page",
                error_class="captcha",
                screenshot_path=screenshot,
            )

        # ── Click Apply button if needed ───────────────────────
        apply_selectors = [
            'a:has-text("Apply for this Job")',
            'a:has-text("Apply")',
            'button:has-text("Apply")',
            '#apply_button',
            'a[href*="application"]',
        ]
        for sel in apply_selectors:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await asyncio.sleep(2)
                    break
            except Exception:
                continue

        # ── Wait for form ──────────────────────────────────────
        form_selectors = [
            'form#application_form',
            'form[action*="/applications"]',
            'form[id*="application"]',
            '#application_form',
        ]
        form_found = False
        for sel in form_selectors:
            try:
                await page.wait_for_selector(sel, timeout=10000)
                form_found = True
                break
            except Exception:
                continue

        if not form_found:
            screenshot = await safe_screenshot(page, "no_form")
            return SubmitResult(
                success=False,
                error="Application form not found on page",
                error_class="form_not_found",
                screenshot_path=screenshot,
            )

        await _emit(ActivityEventType.submission_started, "Form loaded", f"Filling application at {url}")

        # ── Extract fields for this submission ─────────────────
        # Re-extract to get accurate field list from the live page
        fields = await self.extract_questions(url)

        # ── Build fill plan ────────────────────────────────────
        from field_mapper import map_field

        fill_log = []
        filled_count = 0
        skipped = []
        errors = []

        for field in fields:
            name = field.board_field_id or ""
            label = field.label or name
            is_eeo = field.board_specific_meta.get("is_eeo", False)

            # Determine value: approved_answers first, then auto-map
            value = None
            source = "auto"

            # Check approved answers by question_id or label
            gh_qid = str(field.board_specific_meta.get("greenhouse_question_id", ""))
            if gh_qid and gh_qid in answers:
                value = answers[gh_qid]
                source = "approved"
            elif label in answers:
                value = answers[label]
                source = "approved"
            elif name in answers:
                value = answers[name]
                source = "approved"

            if value is None:
                # Auto-map from profile
                job_data = profile.get("_job_data") or {}
                tailored_docs = profile.get("_tailored_docs") or {}
                overrides = {"share_demographics": share_demographics}
                mapped = map_field(field, profile, job_data, tailored_docs, overrides)

                if mapped.source != "needs_user_input" and mapped.value is not None:
                    value = mapped.value
                    source = mapped.source
                else:
                    skipped.append(label)
                    continue

            # ── Fill based on field type ───────────────────────
            try:
                success = False

                if field.field_type == "file":
                    # File upload
                    file_path = None
                    meaning = field.detected_meaning or ""
                    if "resume" in meaning and resume_path:
                        file_path = resume_path
                    elif "cover_letter" in meaning and cover_letter_path:
                        file_path = cover_letter_path
                    elif resume_path and "resume" in label.lower():
                        file_path = resume_path
                    elif cover_letter_path and "cover" in label.lower():
                        file_path = cover_letter_path

                    if file_path:
                        await _emit(
                            ActivityEventType.file_uploading,
                            f"Uploading {label}",
                        )
                        success = await retry_action(
                            _upload_file, page, name, file_path,
                            application_id=app_id, label=f"upload_{name}",
                        )
                        if success:
                            await _emit(ActivityEventType.file_uploaded, f"Uploaded {label}")
                    else:
                        skipped.append(f"{label} (no file)")
                        continue

                elif field.field_type == "select":
                    success = await retry_action(
                        _greenhouse_select, page, name, str(value),
                        field.options, app_id,
                        label=f"select_{name}",
                    )

                elif field.field_type == "multi_select":
                    vals = value if isinstance(value, list) else [str(value)]
                    success = await retry_action(
                        _greenhouse_multi_select, page, name, vals, app_id,
                        label=f"multi_select_{name}",
                    )

                elif field.field_type == "checkbox":
                    if value and str(value).lower() not in ("false", "0", "no", ""):
                        fid = _field_id_for_name(name)
                        checkbox_selectors = [
                            _id_selector(fid),
                            f'input[name="{name}"]',
                        ]
                        for sel in checkbox_selectors:
                            try:
                                await page.check(sel)
                                success = True
                                break
                            except Exception:
                                continue
                        if not success:
                            try:
                                await page.locator(f'label[for="{fid}"]').first.click()
                                success = True
                            except Exception:
                                pass

                elif field.field_type == "radio":
                    fid = _field_id_for_name(name)
                    try:
                        sel = f'input[name="{name}"][value="{value}"]'
                        await page.check(sel)
                        success = True
                    except Exception:
                        # Try fuzzy matching radio option labels
                        try:
                            radios = page.locator(f'input[name="{name}"]')
                            count = await radios.count()
                            if count == 0:
                                radios = page.locator(f'input[name="{fid}"]')
                                count = await radios.count()
                            for i in range(count):
                                radio = radios.nth(i)
                                radio_val = await radio.get_attribute("value") or ""
                                label_el = page.locator(f'label[for="{await radio.get_attribute("id") or ""}"]').first
                                label_text = ""
                                try:
                                    label_text = await label_el.text_content() or ""
                                except Exception:
                                    pass

                                if fuzz:
                                    score = max(
                                        fuzz.token_set_ratio(str(value).lower(), radio_val.lower()),
                                        fuzz.token_set_ratio(str(value).lower(), label_text.lower()),
                                    )
                                else:
                                    score = 100 if str(value).lower() in (radio_val.lower(), label_text.lower()) else 0

                                if score >= 70:
                                    await radio.check()
                                    success = True
                                    break
                        except Exception:
                            pass

                else:
                    # text / textarea
                    fid = _field_id_for_name(name)
                    text_selectors = [
                        _id_selector(fid),
                        f'input[name="{name}"]',
                        f'textarea[name="{name}"]',
                    ]
                    for sel in text_selectors:
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
                    fill_log.append(f"Filled '{label}' from {source}")
                    await _emit(
                        ActivityEventType.field_filled,
                        f"Filled: {label}",
                        payload={"field": label, "source": source},
                    )
                else:
                    errors.append(f"Failed to fill '{label}'")

            except Exception as e:
                errors.append(f"Error filling '{label}': {str(e)[:100]}")
                log_action(app_id, "fill_error", name, str(e)[:100])

        # ── Before-submit screenshot ───────────────────────────
        before_screenshot = await safe_screenshot(page, "before_submit")
        if before_screenshot:
            await _emit(
                ActivityEventType.screenshot_captured,
                "Pre-submission screenshot",
                payload={"label": "before_submit"},
            )

        # ── Click submit ───────────────────────────────────────
        submit_selectors = [
            'input[type="submit"][value*="Submit" i]',
            'button[type="submit"]:has-text("Submit Application")',
            'button[type="submit"]:has-text("Submit")',
            'input[type="submit"]',
            'button[type="submit"]',
        ]

        submitted = False
        for sel in submit_selectors:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    submitted = True
                    break
            except Exception:
                continue

        if not submitted:
            screenshot = await safe_screenshot(page, "no_submit_button")
            return SubmitResult(
                success=False,
                error="Submit button not found",
                error_class="submit_not_found",
                screenshot_path=before_screenshot,
            )

        await _emit(ActivityEventType.submission_clicked, "Submit clicked")

        # ── Wait for outcome ───────────────────────────────────
        result = await _detect_confirmation(page, timeout=30000)
        after_screenshot = await safe_screenshot(page, "after_submit")

        if after_screenshot:
            await _emit(
                ActivityEventType.screenshot_captured,
                "Post-submission screenshot",
                payload={"label": "after_submit"},
            )

        outcome = result.get("outcome", "timeout")

        if outcome == "success":
            confirmation_url = result.get("url", page.url)
            confirmation_text = result.get("text", "")

            await _emit(
                ActivityEventType.confirmation_received,
                "Application confirmed",
                confirmation_text[:200] if confirmation_text else "Confirmation page reached",
            )
            await _emit(ActivityEventType.submission_completed, "Application submitted successfully")

            return SubmitResult(
                success=True,
                confirmation_url=confirmation_url,
                confirmation_text=confirmation_text,
                screenshot_path=after_screenshot,
            )

        elif outcome == "validation_error":
            error_msgs = result.get("errors", [])
            error_str = "Validation: " + "; ".join(error_msgs[:5])
            return SubmitResult(
                success=False,
                error=error_str,
                error_class="validation",
                screenshot_path=after_screenshot,
            )

        elif outcome == "captcha":
            return SubmitResult(
                success=False,
                error="CAPTCHA appeared after clicking submit",
                error_class="captcha",
                screenshot_path=after_screenshot,
            )

        else:
            # Timeout — unclear if success
            return SubmitResult(
                success=False,
                error="No confirmation detected within 30s",
                error_class="timeout",
                screenshot_path=after_screenshot,
            )


# Auto-register on import
register_adapter(GreenhouseAdapter())
