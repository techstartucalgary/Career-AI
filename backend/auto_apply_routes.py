"""
Auto Apply routes - pipeline management, job matching, and automated applications
"""
import base64
import json
import os
import tempfile
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from bson import ObjectId

from dependencies import get_current_user
from models import AutoApplySettingsUpdate, JobApplicationUpdate
import auto_apply_service as service

router = APIRouter(prefix="/api/auto-apply", tags=["Auto Apply"])


def _auth(authorization: str) -> ObjectId:
    """Extract and verify user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        return get_current_user(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


# --- Settings ---

@router.get("/settings")
async def get_settings(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        settings = service.get_settings(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": settings,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.put("/settings")
async def update_settings(payload: AutoApplySettingsUpdate, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        settings = service.update_settings(user_id, payload.model_dump(exclude_none=True))
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Settings updated.",
            "data": settings,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Pipeline ---

@router.get("/pipeline")
async def get_pipeline(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        pipeline = service.get_pipeline(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": pipeline,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.put("/pipeline/{job_id}")
async def update_pipeline_item(job_id: str, payload: JobApplicationUpdate, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        item = service.update_pipeline_status(user_id, job_id, payload.status)
        if not item:
            return JSONResponse(status_code=404, content={
                "success": False,
                "message": "Job not found in pipeline or invalid status.",
            })
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": item,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.delete("/pipeline/{job_id}")
async def remove_pipeline_item(job_id: str, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        removed = service.remove_from_pipeline(user_id, job_id)
        if not removed:
            return JSONResponse(status_code=404, content={
                "success": False,
                "message": "Job not found in pipeline.",
            })
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Removed from pipeline.",
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Matches ---

@router.get("/matches")
async def get_matches(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        matches = await service.fetch_matched_jobs(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": matches,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/matches/{job_id}/save")
async def save_match(job_id: str, authorization: str = Header(None), body: dict = None):
    user_id = _auth(authorization)
    try:
        job_data = body or {}
        job_data["job_id"] = job_id
        item = service.save_to_pipeline(user_id, job_data)
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Job saved to pipeline.",
            "data": item,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/matches/{job_id}/dismiss")
async def dismiss_match(job_id: str, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        service.log_activity(user_id, "dismissed", {"job_id": job_id})
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Match dismissed.",
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Actions ---

@router.post("/apply/{job_id}")
async def apply_to_job(job_id: str, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        result = await service.apply_to_job(user_id, job_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Applied successfully.",
            "data": result,
        })
    except ValueError as e:
        return JSONResponse(status_code=400, content={
            "success": False,
            "message": str(e),
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/generate-cover-letter/{job_id}")
async def generate_cover_letter(job_id: str, authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        cover_letter = await service.generate_cover_letter(user_id, job_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": {"cover_letter": cover_letter},
        })
    except ValueError as e:
        return JSONResponse(status_code=400, content={
            "success": False,
            "message": str(e),
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Agent Control ---

@router.get("/agent/status")
async def agent_status(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        status = service.get_agent_status(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": status,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/agent/start")
async def agent_start(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        status = service.start_agent(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Agent started.",
            "data": status,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/agent/pause")
async def agent_pause(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        status = service.pause_agent(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Agent paused.",
            "data": status,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


@router.post("/agent/run-cycle")
async def agent_run_cycle(authorization: str = Header(None)):
    """Manually trigger one agent cycle (search + score + optionally apply)."""
    user_id = _auth(authorization)
    try:
        result = await service.run_agent_cycle(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "Agent cycle completed.",
            "data": result,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Activity ---

@router.get("/activity")
async def get_activity(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        activity = service.get_activity(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": activity,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Analytics ---

@router.get("/analytics")
async def get_analytics(authorization: str = Header(None)):
    user_id = _auth(authorization)
    try:
        analytics = service.get_analytics(user_id)
        return JSONResponse(status_code=200, content={
            "success": True,
            "data": analytics,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })


# --- Browser Apply (deprecated — redirects to new application system) ---

@router.post("/browser-apply/{job_id}")
async def browser_apply(job_id: str, authorization: str = Header(None)):
    """
    Deprecated: use POST /api/applications/prepare instead.

    This endpoint now prepares the application via the new orchestrator
    (field extraction + mapping + answer generation) and returns the
    application_id for the user to review before submission.
    """
    user_id = _auth(authorization)

    try:
        from application_orchestrator import prepare_application
        app_id = prepare_application(
            user_id=str(user_id),
            job_id=job_id,
        )
        if app_id:
            return JSONResponse(status_code=200, content={
                "success": True,
                "data": {
                    "application_id": app_id,
                    "message": "Application prepared. Use GET /api/applications/{id}/review to review.",
                },
            })
        else:
            return JSONResponse(status_code=500, content={
                "success": False,
                "message": "Failed to prepare application",
            })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": str(e),
        })
