"""
User profile and preferences routes
"""
import base64
from datetime import datetime

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from models import (
    ProfileUpdateRequest,
    PreferencesUpdateRequest,
    OnboardingCompleteRequest,
    DemographicsUpdateRequest,
    AppliedJobRecord,
    SavedJobRecord,
    JobSearchSignalsRequest,
)
from database import col
from dependencies import get_current_user, serialize_user

router = APIRouter()

AVATAR_MAX_BYTES = 2 * 1024 * 1024
APPLIED_JOBS_CAP = 150
SAVED_JOBS_CAP = 250


def _merge_string_signals(existing, additions, cap: int) -> list[str]:
    base = [str(x).strip() for x in (existing or []) if str(x).strip()]
    seen = {x.lower() for x in base}
    for x in additions or []:
        s = str(x).strip()
        if not s or len(s) > 160 or s.lower() in seen:
            continue
        base.append(s)
        seen.add(s.lower())
    return base[-cap:] if len(base) > cap else base


def _applied_job_key(entry: dict) -> str:
    src = str(entry.get("source") or "linkedin").strip().lower()
    jid = str(entry.get("id") or "").strip()
    return f"{src}::{jid}"


def _saved_job_key(entry: dict) -> str:
    src = str(entry.get("source") or "linkedin").strip().lower()
    jid = str(entry.get("id") or "").strip()
    return f"{src}::{jid}"


def _detect_image_mime(data: bytes):
    """Validate binary is JPEG, PNG, or WebP via magic bytes."""
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.get("/profile")
def read_user(authorization: str = Header(None)):
    """Get user profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]  # everything after "Bearer "
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        user = col.find_one({"_id": user_id})
        if not user:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "User not found."
                }
            )
        
        serialized = serialize_user(user)
        
        # Ensure identification fields always exist
        if "sex" not in serialized:
            serialized["sex"] = ""
        if "gender" not in serialized:
            serialized["gender"] = ""
        if "disability" not in serialized:
            serialized["disability"] = ""
        if "race" not in serialized:
            serialized["race"] = ""
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": serialized
            }
        )
    except Exception as e:
        print(f"Profile GET error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest, authorization: str = Header(None)):
    """Update user profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "No profile fields provided."
            }
        )

    if "display_name" not in updates and ("first_name" in updates or "last_name" in updates):
        first_name = updates.get("first_name", "")
        last_name = updates.get("last_name", "")
        combined = f"{first_name} {last_name}".strip()
        if combined:
            updates["display_name"] = combined

    try:
        col.update_one({"_id": user_id}, {"$set": {f"profile.{k}": v for k, v in updates.items()}})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Profile updated."
            }
        )
    except Exception as e:
        print(f"Profile PUT error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


async def _upload_profile_avatar_impl(
    avatar_file: UploadFile,
    authorization: str,
):
    """Upload profile picture (JPEG, PNG, or WebP, max 2MB). Stored as base64 on user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        raw = await avatar_file.read()
        if len(raw) > AVATAR_MAX_BYTES:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Photo must be 2MB or smaller.",
                },
            )

        mime = _detect_image_mime(raw)
        if not mime:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Use a JPEG, PNG, or WebP image.",
                },
            )

        b64 = base64.b64encode(raw).decode("utf-8")
        col.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "profile.avatar_base64": b64,
                    "profile.avatar_mime": mime,
                    "profile.avatar_updated_at": datetime.utcnow().isoformat(),
                    "profile.avatar_opt_out": False,
                }
            },
        )
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Profile photo updated.",
            },
        )
    except Exception as e:
        print(f"Avatar upload error: {str(e)}")
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Could not save profile photo.",
            },
        )


@router.post("/profile/avatar")
async def upload_profile_avatar(
    avatar_file: UploadFile = File(...),
    authorization: str = Header(None),
):
    return await _upload_profile_avatar_impl(avatar_file, authorization)


@router.post("/api/profile/avatar")
async def upload_profile_avatar_api_alias(
    avatar_file: UploadFile = File(...),
    authorization: str = Header(None),
):
    """Same as POST /profile/avatar (alias for proxies that only forward /api/*)."""
    return await _upload_profile_avatar_impl(avatar_file, authorization)


def _delete_profile_avatar_impl(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        col.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "profile.avatar_opt_out": True,
                },
                "$unset": {
                    "profile.avatar_base64": "",
                    "profile.avatar_mime": "",
                    "profile.avatar_updated_at": "",
                    "profile.avatar_url": "",
                },
            },
        )
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Profile photo removed.",
            },
        )
    except Exception as e:
        print(f"Avatar delete error: {str(e)}")
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Could not remove profile photo.",
            },
        )


@router.delete("/profile/avatar")
def delete_profile_avatar(authorization: str = Header(None)):
    """Remove stored profile picture."""
    return _delete_profile_avatar_impl(authorization)


@router.delete("/api/profile/avatar")
def delete_profile_avatar_api_alias(authorization: str = Header(None)):
    """Same as DELETE /profile/avatar."""
    return _delete_profile_avatar_impl(authorization)


@router.put("/preferences")
def update_preferences(payload: PreferencesUpdateRequest, authorization: str = Header(None)):
    """Update user job preferences"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "No preferences provided."
            }
        )

    try:
        col.update_one({"_id": user_id}, {"$set": {f"job_preferences.{k}": v for k, v in updates.items()}})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Preferences updated."
            }
        )
    except Exception as e:
        print(f"Preferences error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@router.post("/onboarding/complete")
def complete_onboarding(payload: OnboardingCompleteRequest, authorization: str = Header(None)):
    """Complete user onboarding"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    required_fields = [
        payload.first_name,
        payload.last_name,
        payload.phone,
        payload.linkedin,
        payload.location,
        payload.positions,
        payload.locations,
        payload.work_arrangement,
    ]
    if (
        not all(required_fields)
        or not str(payload.first_name).strip()
        or not str(payload.last_name).strip()
        or not str(payload.phone).strip()
        or not str(payload.linkedin).strip()
        or not str(payload.location).strip()
        or not payload.positions
        or not payload.locations
    ):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing required onboarding fields."
            }
        )

    display_name = f"{payload.first_name} {payload.last_name}".strip()
    profile_update = {
        "profile.display_name": display_name,
        "profile.first_name": payload.first_name,
        "profile.last_name": payload.last_name,
        "profile.phone": payload.phone,
        "profile.location": payload.location,
        "profile.linkedin": payload.linkedin,
        "profile.github": payload.github or "",
        "profile.website": payload.website or "",
    }

    preferences_update = {
        "job_preferences.positions": payload.positions,
        "job_preferences.locations": payload.locations,
        "job_preferences.work_arrangement": payload.work_arrangement,
    }
    
    # Initialize identification fields if they don't exist
    identification_update = {
        "sex": "",
        "gender": "",
        "disability": "",
        "race": "",
    }

    try:
        col.update_one(
            {"_id": user_id},
            {"$set": {**profile_update, **preferences_update, **identification_update, "profile_completed": True}}
        )
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Onboarding completed."
            }
        )
    except Exception as e:
        print(f"Onboarding complete error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@router.put("/demographics")
def update_demographics(payload: DemographicsUpdateRequest, authorization: str = Header(None)):
    """Update user demographics"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "No demographics provided."
            }
        )

    try:
        col.update_one({"_id": user_id}, {"$set": updates})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Demographics updated."
            }
        )
    except Exception as e:
        print(f"Demographics error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@router.get("/applied-jobs")
def list_applied_jobs(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    jobs = user.get("applied_jobs") if isinstance(user.get("applied_jobs"), list) else []
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "jobs": jobs,
            "total_count": len(jobs),
        },
    )


@router.post("/applied-jobs")
def record_applied_job(payload: AppliedJobRecord, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    jid = str(payload.id or "").strip()
    if not jid:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Job id is required."},
        )

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = [dict(x) for x in (user.get("applied_jobs") or []) if isinstance(x, dict)]
    record = {k: v for k, v in payload.dict().items() if v is not None}
    record["id"] = jid
    record["source"] = str(record.get("source") or "linkedin").strip().lower()
    record["applied_at"] = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

    nk = _applied_job_key(record)
    filtered = [x for x in existing if _applied_job_key(x) != nk]
    filtered.insert(0, record)
    filtered = filtered[:APPLIED_JOBS_CAP]

    col.update_one({"_id": user_id}, {"$set": {"applied_jobs": filtered}})
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Application recorded."},
    )


@router.get("/saved-jobs")
def list_saved_jobs(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    jobs = user.get("saved_jobs") if isinstance(user.get("saved_jobs"), list) else []
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "jobs": jobs,
            "total_count": len(jobs),
        },
    )


@router.post("/saved-jobs")
def record_saved_job(payload: SavedJobRecord, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    jid = str(payload.id or "").strip()
    if not jid:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Job id is required."},
        )

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = [dict(x) for x in (user.get("saved_jobs") or []) if isinstance(x, dict)]
    record = {k: v for k, v in payload.dict().items() if v is not None}
    record["id"] = jid
    record["source"] = str(record.get("source") or "linkedin").strip().lower()
    record["saved_at"] = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

    nk = _saved_job_key(record)
    filtered = [x for x in existing if _saved_job_key(x) != nk]
    filtered.insert(0, record)
    filtered = filtered[:SAVED_JOBS_CAP]

    col.update_one({"_id": user_id}, {"$set": {"saved_jobs": filtered}})
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Job saved."},
    )


@router.delete("/saved-jobs/{job_id}")
def remove_saved_job(job_id: str, source: str = "linkedin", authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_key = f"{str(source or 'linkedin').strip().lower()}::{str(job_id or '').strip()}"
    existing = [dict(x) for x in (user.get("saved_jobs") or []) if isinstance(x, dict)]
    filtered = [x for x in existing if _saved_job_key(x) != target_key]

    col.update_one({"_id": user_id}, {"$set": {"saved_jobs": filtered}})
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Saved job removed."},
    )


@router.post("/job-search-signals")
def record_job_search_signals(payload: JobSearchSignalsRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    kw_in = [str(x).strip() for x in (payload.keywords or []) if str(x).strip()]
    loc_in = [str(x).strip() for x in (payload.locations or []) if str(x).strip()]
    if not kw_in and not loc_in:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "No keywords or locations provided."},
        )

    user = col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    jp = user.get("job_preferences") if isinstance(user.get("job_preferences"), dict) else {}
    merged_kw = _merge_string_signals(jp.get("learned_keywords"), kw_in, 36)
    merged_loc = _merge_string_signals(jp.get("learned_locations"), loc_in, 36)

    col.update_one(
        {"_id": user_id},
        {
            "$set": {
                "job_preferences.learned_keywords": merged_kw,
                "job_preferences.learned_locations": merged_loc,
            }
        },
    )
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Search signals saved.",
            "learned_keywords": merged_kw,
            "learned_locations": merged_loc,
        },
    )
