"""
REST API routes for the application lifecycle:
prepare, review, approve, cancel, list.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field

from database import applications_col
from dependencies import get_current_user
from models_application import ApplicationStatus
from models_activity import ActivityEventType
from activity_emitter import emitter
from application_orchestrator import prepare_application
from question_answerer import answer_question, _write_answer_to_cache


router = APIRouter(prefix="/api/applications", tags=["applications"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_user_id(authorization: str) -> str:
    """Extract user_id from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    user_id = get_current_user(token)
    return str(user_id)


def _serialize_app(doc: dict) -> dict:
    """Convert MongoDB doc to JSON-safe dict."""
    doc["_id"] = str(doc["_id"])
    return doc


# ── Request models ────────────────────────────────────────────────

class PrepareRequest(BaseModel):
    job_id: str
    tailoring_id: Optional[str] = None


class ReviewRequest(BaseModel):
    approved_answers: list = Field(default_factory=list)
    share_demographics: bool = False


class RegenerateRequest(BaseModel):
    question_id: str
    hint: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────

@router.post("/prepare")
async def prepare(body: PrepareRequest, authorization: str = Header(None)):
    """Create and prepare an application for a job. Returns application_id."""
    user_id = _get_user_id(authorization)

    app_id = prepare_application(
        user_id=user_id,
        job_id=body.job_id,
        tailoring_id=body.tailoring_id,
    )

    if not app_id:
        raise HTTPException(status_code=500, detail="Failed to prepare application")

    return {"success": True, "data": {"application_id": app_id}}


@router.get("/{app_id}")
async def get_application(app_id: str, authorization: str = Header(None)):
    """Get full application document."""
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        doc = applications_col.find_one({"_id": ObjectId(app_id), "user_id": user_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"success": True, "data": _serialize_app(doc)}


@router.get("/{app_id}/review")
async def get_review(app_id: str, authorization: str = Header(None)):
    """Get generated answers and auto-filled fields for review."""
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        doc = applications_col.find_one({"_id": ObjectId(app_id), "user_id": user_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "success": True,
        "data": {
            "application_id": str(doc["_id"]),
            "status": doc.get("status"),
            "extracted_fields": doc.get("extracted_fields", []),
            "generated_answers": doc.get("generated_answers", []),
            "auto_filled_values": doc.get("auto_filled_values", {}),
            "fill_log": doc.get("fill_log", []),
        },
    }


@router.post("/{app_id}/review")
async def submit_review(
    app_id: str,
    body: ReviewRequest,
    authorization: str = Header(None),
):
    """
    Submit user-approved answers and move application to 'queued' status.
    This is the explicit user approval step before any browser submission.
    """
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    doc = applications_col.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")

    if doc.get("status") != ApplicationStatus.pending_user_review.value:
        raise HTTPException(
            status_code=400,
            detail=f"Application is in '{doc.get('status')}' status, not pending_user_review",
        )

    now = _now_iso()
    applications_col.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": ApplicationStatus.queued.value,
                "user_approved_answers": body.approved_answers,
                "share_demographics": body.share_demographics,
                "queued_at": now,
                "updated_at": now,
            }
        },
    )

    # Write reusable answers to user cache
    for ans in body.approved_answers:
        if isinstance(ans, dict) and ans.get("final_answer"):
            # Check if this answer maps to a reusable question
            gen_answers = doc.get("generated_answers", [])
            matching_gen = next(
                (g for g in gen_answers if g.get("question_id") == ans.get("question_id")),
                None,
            )
            if matching_gen and matching_gen.get("is_reusable"):
                _write_answer_to_cache(
                    user_id=user_id,
                    question_text=matching_gen.get("question_text", ""),
                    final_answer=ans["final_answer"],
                    is_reusable=True,
                )

    emitter.emit(
        user_id=user_id,
        event_type=ActivityEventType.review_approved,
        title="Review approved",
        description="Application queued for submission",
        application_id=app_id,
        severity="success",
    )

    return {"success": True, "data": {"status": "queued"}}


@router.post("/{app_id}/regenerate-answer")
async def regenerate_answer(
    app_id: str,
    body: RegenerateRequest,
    authorization: str = Header(None),
):
    """Regenerate a single answer with an optional hint."""
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        doc = applications_col.find_one({"_id": ObjectId(app_id), "user_id": user_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")

    # Find the question
    gen_answers = doc.get("generated_answers", [])
    target = next((a for a in gen_answers if a.get("question_id") == body.question_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Question not found in this application")

    # Regenerate
    new_answer = answer_question(
        question_text=target["question_text"],
        user_id=user_id,
        job_id=doc["job_id"],
        hint=body.hint,
    )

    # Replace in the generated_answers list
    updated = []
    for a in gen_answers:
        if a.get("question_id") == body.question_id:
            updated.append(new_answer.model_dump())
        else:
            updated.append(a)

    applications_col.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": {"generated_answers": updated, "updated_at": _now_iso()}},
    )

    return {"success": True, "data": new_answer.model_dump()}


@router.post("/{app_id}/cancel")
async def cancel_application(app_id: str, authorization: str = Header(None)):
    """Cancel an application."""
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    doc = applications_col.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")

    terminal_statuses = {
        ApplicationStatus.completed.value,
        ApplicationStatus.cancelled.value,
    }
    if doc.get("status") in terminal_statuses:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed/cancelled application")

    applications_col.update_one(
        {"_id": oid},
        {"$set": {"status": ApplicationStatus.cancelled.value, "updated_at": _now_iso()}},
    )

    return {"success": True, "data": {"status": "cancelled"}}


@router.get("")
async def list_applications(
    authorization: str = Header(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List user's applications, paginated and optionally filtered by status."""
    user_id = _get_user_id(authorization)

    if applications_col is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": user_id}
    if status:
        query["status"] = status

    total = applications_col.count_documents(query)
    skip = (page - 1) * limit

    docs = list(
        applications_col.find(query)
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )

    items = [_serialize_app(d) for d in docs]

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
        },
    }
