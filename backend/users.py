"""
User profile and preferences routes
"""
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

from models import ProfileUpdateRequest, PreferencesUpdateRequest, OnboardingCompleteRequest, DemographicsUpdateRequest
from database import col
from dependencies import get_current_user, serialize_user

router = APIRouter()


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
            {"$set": {**profile_update, **preferences_update, **identification_update, "onboarding_complete": True}}
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
