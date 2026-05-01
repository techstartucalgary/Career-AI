"""
Application orchestrator — prepares an application by extracting form fields,
mapping profile data, generating answers for custom questions, and staging
everything for user review.
"""
import traceback
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from database import applications_col, col as users_col
from models_application import ApplicationStatus, ApplicationDoc
from models_activity import ActivityEventType
from activity_emitter import emitter
from adapters import get_adapter
from field_detector import detect_meaning
from field_mapper import map_field, MappedValue
from question_answerer import answer_question


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def prepare_application(
    user_id: str,
    job_id: str,
    tailoring_id: Optional[str] = None,
) -> Optional[str]:
    """
    Prepare an application for user review.

    1. Validate the user and job exist.
    2. Determine the adapter (board type) from the job URL.
    3. Create an application document.
    4. Extract form fields via the adapter.
    5. Map profile data and generate answers for custom questions.
    6. Set status to pending_user_review and emit awaiting_review event.

    Returns the application _id as a string, or None on failure.
    """
    if applications_col is None or users_col is None:
        print("Database not connected — cannot prepare application")
        return None

    uid = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
    user_id_str = str(uid)

    # ── Load user profile ──────────────────────────────────────
    profile = users_col.find_one({"_id": uid})
    if not profile:
        print(f"User {user_id_str} not found")
        return None

    # ── Load job from pipeline ─────────────────────────────────
    from auto_apply_service import get_pipeline_col
    pipeline_col = get_pipeline_col()
    job_doc = pipeline_col.find_one({"user_id": uid, "job_id": job_id})
    if not job_doc:
        print(f"Job {job_id} not found in pipeline for user {user_id_str}")
        return None

    job_data = job_doc.get("job_data", {})
    application_url = job_data.get("url") or job_data.get("apply_url") or ""

    # ── Determine adapter ──────────────────────────────────────
    adapter = get_adapter(application_url) if application_url else None
    board_name = None

    if adapter:
        board_name = adapter.__class__.__name__.replace("Adapter", "").lower()

    # ── Check for existing application ─────────────────────────
    existing = applications_col.find_one({"user_id": user_id_str, "job_id": job_id})
    if existing:
        return str(existing["_id"])

    # ── Create application document ────────────────────────────
    now = _now_iso()
    app_doc = {
        "user_id": user_id_str,
        "job_id": job_id,
        "tailoring_id": tailoring_id,
        "board": board_name,
        "application_url": application_url,
        "status": ApplicationStatus.pending_extraction.value,
        "created_at": now,
        "updated_at": now,
        "extracted_fields": [],
        "generated_answers": [],
        "user_approved_answers": [],
        "auto_filled_values": {},
        "share_demographics": False,
        "fill_log": [],
        "screenshots": [],
        "error_reason": None,
        "error_class": None,
        "retry_count": 0,
        "worker_id": None,
    }

    # If no adapter found → unsupported board
    if not adapter and application_url:
        app_doc["status"] = ApplicationStatus.unsupported_board.value
        result = applications_col.insert_one(app_doc)
        app_id = str(result.inserted_id)

        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.extraction_completed,
            title="Unsupported job board",
            description=f"No adapter available for {application_url}",
            application_id=app_id,
            severity="warning",
        )
        return app_id

    if not application_url:
        app_doc["status"] = ApplicationStatus.unsupported_board.value
        app_doc["error_reason"] = "No application URL found for this job"
        result = applications_col.insert_one(app_doc)
        return str(result.inserted_id)

    result = applications_col.insert_one(app_doc)
    app_id = str(result.inserted_id)

    # ── Emit extraction_started ────────────────────────────────
    emitter.emit(
        user_id=user_id_str,
        event_type=ActivityEventType.extraction_started,
        title="Extracting application fields",
        description=f"Analyzing form for {job_data.get('title', 'job')} at {job_data.get('company', '')}",
        application_id=app_id,
    )

    # ── Extract questions via adapter ──────────────────────────
    try:
        import asyncio
        loop = None
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        if loop and loop.is_running():
            # Already in an async context — run in a thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                fields = pool.submit(
                    lambda: asyncio.run(adapter.extract_questions(application_url))
                ).result(timeout=60)
        else:
            fields = asyncio.run(adapter.extract_questions(application_url))

    except NotImplementedError:
        # Adapter is a stub — create placeholder fields
        fields = []
        applications_col.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "status": ApplicationStatus.pending_user_review.value,
                    "updated_at": _now_iso(),
                    "fill_log": ["Adapter not yet implemented — no fields extracted"],
                }
            },
        )
        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.awaiting_review,
            title="Ready for review",
            description=f"Application for {job_data.get('title', 'job')} is ready (adapter pending implementation)",
            application_id=app_id,
            payload={"questions_count": 0, "auto_filled_count": 0},
        )
        return app_id

    except Exception as e:
        traceback.print_exc()
        applications_col.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "status": ApplicationStatus.failed.value,
                    "error_reason": str(e)[:500],
                    "error_class": type(e).__name__,
                    "updated_at": _now_iso(),
                }
            },
        )
        emitter.emit(
            user_id=user_id_str,
            event_type=ActivityEventType.submission_failed,
            title="Extraction failed",
            description=str(e)[:200],
            application_id=app_id,
            severity="error",
        )
        return app_id

    # ── Detect meanings and map fields ─────────────────────────
    tailored_docs = {
        "resume_b64": (profile.get("resume") or {}).get("file_data"),
        "cover_letter_text": job_doc.get("cover_letter"),
    }
    overrides = {"share_demographics": False}

    extracted_fields = []
    generated_answers = []
    auto_filled = {}
    fill_log = []
    questions_needing_review = 0

    for i, field in enumerate(fields):
        # Detect meaning if not already set
        if not field.detected_meaning or field.detected_meaning == "unknown":
            meaning, confidence = detect_meaning(
                label=field.label,
                context={"field_type": field.field_type, "required": field.required},
                board=board_name or "generic",
            )
            field.detected_meaning = meaning
        else:
            confidence = 0.9

        # Map field to value
        mapped = map_field(
            field=field,
            profile=profile,
            job=job_data,
            tailored_docs=tailored_docs,
            overrides=overrides,
        )

        if mapped.source != "needs_user_input" and mapped.value is not None:
            # Auto-fillable
            auto_filled[field.label or f"field_{i}"] = mapped.value
            fill_log.append(f"Auto-filled '{field.label}' from {mapped.source} (confidence: {mapped.confidence:.2f})")
        else:
            # Needs user input — try question answerer for free-text
            questions_needing_review += 1

            if field.field_type in ("text", "textarea") and field.detected_meaning in (
                "why_company", "why_role", "tell_us_about_yourself",
                "biggest_challenge", "strengths", "weaknesses",
                "additional_info", "unknown",
            ):
                try:
                    answer = answer_question(
                        question_text=field.label,
                        user_id=user_id_str,
                        job_id=job_id,
                    )
                    generated_answers.append(answer.model_dump())
                    fill_log.append(
                        f"Generated answer for '{field.label}' "
                        f"(needs_input={answer.needs_user_input}, reusable={answer.is_reusable})"
                    )
                except Exception as e:
                    fill_log.append(f"Failed to generate answer for '{field.label}': {e}")
            else:
                fill_log.append(f"Needs user input: '{field.label}' ({field.detected_meaning})")

        extracted_fields.append(field.model_dump())

    # ── Update application document ────────────────────────────
    applications_col.update_one(
        {"_id": result.inserted_id},
        {
            "$set": {
                "status": ApplicationStatus.pending_user_review.value,
                "extracted_fields": extracted_fields,
                "generated_answers": generated_answers,
                "auto_filled_values": auto_filled,
                "fill_log": fill_log,
                "updated_at": _now_iso(),
            }
        },
    )

    # ── Emit events ────────────────────────────────────────────
    emitter.emit(
        user_id=user_id_str,
        event_type=ActivityEventType.extraction_completed,
        title="Fields extracted",
        description=f"Found {len(fields)} fields, {len(auto_filled)} auto-filled",
        application_id=app_id,
        payload={"total_fields": len(fields), "auto_filled": len(auto_filled)},
    )

    emitter.emit(
        user_id=user_id_str,
        event_type=ActivityEventType.awaiting_review,
        title="Ready for review",
        description=f"Application for {job_data.get('title', 'job')} at {job_data.get('company', '')} needs your review",
        application_id=app_id,
        payload={
            "questions_count": questions_needing_review,
            "auto_filled_count": len(auto_filled),
            "generated_answers_count": len(generated_answers),
        },
    )

    return app_id
