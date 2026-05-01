"""
Long-running apply worker process.

Picks up applications in 'queued' status, opens a Playwright browser,
and delegates to the appropriate board adapter for form filling + submission.

Entry point:  python apply_worker.py
"""
import asyncio
import base64
import os
import signal
import sys
import tempfile
import uuid
from datetime import datetime, timezone

# Ensure backend directory is on sys.path so imports resolve
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import applications_col, worker_health_col
from models_application import ApplicationStatus
from models_activity import ActivityEventType
from activity_emitter import emitter
from adapters import get_adapter


# ── Configuration ─────────────────────────────────────────────────

WORKER_ID = f"worker-{uuid.uuid4().hex[:8]}"
WORKER_VERSION = "1.0.0"
HEARTBEAT_INTERVAL = 10  # seconds
MAX_CONCURRENT = int(os.getenv("MAX_CONCURRENT_SUBMISSIONS", "3"))
HEADLESS = os.getenv("HEADLESS_MODE", "true").lower() in ("true", "1", "yes")
POLL_INTERVAL = 5  # seconds between checking for new work
SHUTDOWN_TIMEOUT = 60  # seconds to wait for in-flight work on SIGTERM

# Browser context settings
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1440, "height": 900}
LOCALE = "en-US"
DEFAULT_TIMEZONE = "America/New_York"


# ── Graceful shutdown ─────────────────────────────────────────────

_shutdown_event = asyncio.Event()


def _handle_signal(signum, frame):
    print(f"\n[{WORKER_ID}] Received signal {signum}, shutting down gracefully...")
    _shutdown_event.set()


# ── Heartbeat ─────────────────────────────────────────────────────

async def _heartbeat_loop():
    """Send heartbeat to worker_health collection every HEARTBEAT_INTERVAL seconds."""
    while not _shutdown_event.is_set():
        if worker_health_col is not None:
            try:
                worker_health_col.update_one(
                    {"worker_id": WORKER_ID},
                    {
                        "$set": {
                            "worker_id": WORKER_ID,
                            "last_heartbeat": datetime.now(timezone.utc).isoformat(),
                            "version": WORKER_VERSION,
                        },
                        "$setOnInsert": {
                            "started_at": datetime.now(timezone.utc).isoformat(),
                            "current_load": 0,
                        },
                    },
                    upsert=True,
                )
            except Exception as e:
                print(f"[{WORKER_ID}] Heartbeat failed: {e}")
        try:
            await asyncio.wait_for(_shutdown_event.wait(), timeout=HEARTBEAT_INTERVAL)
            break  # shutdown requested
        except asyncio.TimeoutError:
            pass  # normal — loop again


# ── Claim work ────────────────────────────────────────────────────

def _claim_application():
    """
    Atomically claim one application with status='queued', oldest first.
    Returns the application document or None.
    """
    if applications_col is None:
        return None

    now = datetime.now(timezone.utc).isoformat()
    doc = applications_col.find_one_and_update(
        {"status": ApplicationStatus.queued.value},
        {
            "$set": {
                "status": ApplicationStatus.running.value,
                "worker_id": WORKER_ID,
                "started_at": now,
                "updated_at": now,
            }
        },
        sort=[("queued_at", 1)],
        return_document=True,
    )
    return doc


# ── Screenshot helper ─────────────────────────────────────────────

async def _take_screenshot(page, label: str) -> dict:
    """Take a screenshot and return a ScreenshotRecord dict."""
    try:
        png = await page.screenshot(type="png", full_page=False)
        b64 = base64.b64encode(png).decode("utf-8")
        return {
            "label": label,
            "b64_data": b64,
            "taken_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception:
        return None


# ── Process a single application ──────────────────────────────────

async def _process_application(app_doc: dict):
    """Process one queued application through the full submission pipeline."""
    app_id = str(app_doc["_id"])
    user_id = app_doc["user_id"]
    application_url = app_doc.get("application_url", "")

    print(f"[{WORKER_ID}] Processing application {app_id} for user {user_id}")

    # Emit submission_started
    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.submission_started,
        title="Submission started",
        description=f"Opening {application_url}",
        application_id=app_id,
    )

    # Get adapter
    adapter = get_adapter(application_url)
    if not adapter:
        applications_col.update_one(
            {"_id": app_doc["_id"]},
            {
                "$set": {
                    "status": ApplicationStatus.unsupported_board.value,
                    "error_reason": "No adapter for this URL",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        emitter.emit(
            user_id=user_id,
            event_type=ActivityEventType.submission_failed,
            title="Unsupported board",
            application_id=app_id,
            severity="error",
        )
        return

    # Load user profile for filling
    from database import col as users_col
    from bson import ObjectId
    profile = users_col.find_one({"_id": ObjectId(user_id)}) if users_col else None

    # Build emit_progress callback
    async def emit_progress(event_type, title, description="", payload=None):
        emitter.emit(
            user_id=user_id,
            event_type=event_type,
            title=title,
            description=description,
            application_id=app_id,
            payload=payload,
        )

    # Prepare resume + cover letter as temp files
    resume_tmpfile = None
    cover_letter_tmpfile = None

    try:
        # Write resume to temp file if available
        resume_b64 = (profile.get("resume") or {}).get("file_data") if profile else None
        if resume_b64:
            resume_tmpfile = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
            resume_tmpfile.write(base64.b64decode(resume_b64))
            resume_tmpfile.close()

        cover_letter_text = app_doc.get("cover_letter_text")

        # Open Playwright browser
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=HEADLESS)
            context = await browser.new_context(
                viewport=VIEWPORT,
                user_agent=USER_AGENT,
                locale=LOCALE,
                timezone_id=DEFAULT_TIMEZONE,
            )
            page = await context.new_page()

            try:
                # Navigate
                await page.goto(application_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(2)

                # Check for CAPTCHA
                captcha_selectors = [
                    'iframe[src*="recaptcha"]', 'iframe[src*="hcaptcha"]',
                    '.g-recaptcha', '[data-sitekey]',
                ]
                for sel in captcha_selectors:
                    try:
                        if await page.locator(sel).count() > 0:
                            screenshot = await _take_screenshot(page, "captcha_detected")
                            screenshots = [screenshot] if screenshot else []
                            applications_col.update_one(
                                {"_id": app_doc["_id"]},
                                {
                                    "$set": {
                                        "status": ApplicationStatus.blocked_captcha.value,
                                        "screenshots": screenshots,
                                        "error_reason": "CAPTCHA detected on application page",
                                        "updated_at": datetime.now(timezone.utc).isoformat(),
                                    }
                                },
                            )
                            emitter.emit(
                                user_id=user_id,
                                event_type=ActivityEventType.captcha_detected,
                                title="CAPTCHA detected",
                                description="Please complete the application manually",
                                application_id=app_id,
                                payload={"url": application_url},
                                severity="warning",
                            )
                            await browser.close()
                            return
                    except Exception:
                        continue

                # Delegate to adapter
                approved_answers = {
                    a.get("question_id"): a.get("final_answer")
                    for a in (app_doc.get("user_approved_answers") or [])
                }

                submit_result = await adapter.submit_application(
                    page=page,
                    url=application_url,
                    profile=profile or {},
                    answers=approved_answers,
                    resume_path=resume_tmpfile.name if resume_tmpfile else None,
                    cover_letter_path=None,
                    emit_progress=emit_progress,
                )

                # Take final screenshot
                final_screenshot = await _take_screenshot(page, "post_submission")

                now = datetime.now(timezone.utc).isoformat()
                if submit_result.success:
                    screenshots = [final_screenshot] if final_screenshot else []
                    applications_col.update_one(
                        {"_id": app_doc["_id"]},
                        {
                            "$set": {
                                "status": ApplicationStatus.completed.value,
                                "confirmation_url": submit_result.confirmation_url,
                                "confirmation_text": submit_result.confirmation_text,
                                "screenshots": screenshots,
                                "completed_at": now,
                                "updated_at": now,
                            }
                        },
                    )
                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.submission_completed,
                        title="Application submitted",
                        application_id=app_id,
                        severity="success",
                    )
                elif submit_result.error_class == "captcha":
                    screenshots = [final_screenshot] if final_screenshot else []
                    applications_col.update_one(
                        {"_id": app_doc["_id"]},
                        {
                            "$set": {
                                "status": ApplicationStatus.blocked_captcha.value,
                                "error_reason": submit_result.error,
                                "error_class": submit_result.error_class,
                                "screenshots": screenshots,
                                "application_url": application_url,
                                "updated_at": now,
                            }
                        },
                    )
                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.captcha_detected,
                        title="CAPTCHA detected",
                        description="Complete this application in your browser",
                        application_id=app_id,
                        payload={"url": application_url},
                        severity="warning",
                    )

                elif submit_result.error_class == "corporate_redirect":
                    screenshots = [final_screenshot] if final_screenshot else []
                    applications_col.update_one(
                        {"_id": app_doc["_id"]},
                        {
                            "$set": {
                                "status": ApplicationStatus.unsupported_board.value,
                                "error_reason": submit_result.error,
                                "error_class": submit_result.error_class,
                                "screenshots": screenshots,
                                "application_url": application_url,
                                "updated_at": now,
                            }
                        },
                    )
                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.submission_failed,
                        title="Manual application required",
                        description=submit_result.error,
                        application_id=app_id,
                        payload={"url": application_url},
                        severity="warning",
                    )

                else:
                    screenshots = [final_screenshot] if final_screenshot else []
                    applications_col.update_one(
                        {"_id": app_doc["_id"]},
                        {
                            "$set": {
                                "status": ApplicationStatus.failed.value,
                                "error_reason": submit_result.error,
                                "error_class": submit_result.error_class,
                                "screenshots": screenshots,
                                "updated_at": now,
                            }
                        },
                    )
                    emitter.emit(
                        user_id=user_id,
                        event_type=ActivityEventType.submission_failed,
                        title="Submission failed",
                        description=submit_result.error or "Unknown error",
                        application_id=app_id,
                        severity="error",
                    )

            except Exception as e:
                # Take error screenshot
                error_screenshot = await _take_screenshot(page, "error")
                screenshots = [error_screenshot] if error_screenshot else []
                applications_col.update_one(
                    {"_id": app_doc["_id"]},
                    {
                        "$set": {
                            "status": ApplicationStatus.failed.value,
                            "error_reason": str(e)[:500],
                            "error_class": type(e).__name__,
                            "screenshots": screenshots,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
                    },
                )
                emitter.emit(
                    user_id=user_id,
                    event_type=ActivityEventType.submission_failed,
                    title="Submission error",
                    description=str(e)[:200],
                    application_id=app_id,
                    severity="error",
                )
            finally:
                await browser.close()

    finally:
        # Clean up temp files
        if resume_tmpfile:
            try:
                os.unlink(resume_tmpfile.name)
            except OSError:
                pass


# ── Main worker loop ──────────────────────────────────────────────

async def _worker_loop():
    """Main loop: poll for queued applications, process with concurrency limit."""
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = set()

    print(f"[{WORKER_ID}] Worker started (max_concurrent={MAX_CONCURRENT}, headless={HEADLESS})")

    while not _shutdown_event.is_set():
        # Don't claim more work if at capacity
        if semaphore._value == 0:
            await asyncio.sleep(1)
            continue

        app_doc = _claim_application()
        if app_doc is None:
            # No work available — wait and poll again
            try:
                await asyncio.wait_for(_shutdown_event.wait(), timeout=POLL_INTERVAL)
                break
            except asyncio.TimeoutError:
                continue

        # Process in background with semaphore
        async def _run(doc):
            async with semaphore:
                await _process_application(doc)

        task = asyncio.create_task(_run(app_doc))
        tasks.add(task)
        task.add_done_callback(tasks.discard)

    # Wait for in-flight tasks on shutdown
    if tasks:
        print(f"[{WORKER_ID}] Waiting for {len(tasks)} in-flight tasks...")
        done, pending = await asyncio.wait(tasks, timeout=SHUTDOWN_TIMEOUT)
        if pending:
            print(f"[{WORKER_ID}] {len(pending)} tasks did not finish in time")
            for t in pending:
                t.cancel()

    # Clean up worker health
    if worker_health_col is not None:
        try:
            worker_health_col.delete_one({"worker_id": WORKER_ID})
        except Exception:
            pass

    print(f"[{WORKER_ID}] Worker stopped")


async def main():
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    heartbeat_task = asyncio.create_task(_heartbeat_loop())
    worker_task = asyncio.create_task(_worker_loop())

    await asyncio.gather(heartbeat_task, worker_task)


if __name__ == "__main__":
    asyncio.run(main())
