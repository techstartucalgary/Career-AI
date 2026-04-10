"""
Authentication routes using Google OAuth + profile completion
"""

import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database import col, deleted_users_col
from dependencies import create_access_token, get_current_user, hash_, verify_hash, serialize_user
from models import SignupRequest, LoginRequest

load_dotenv()

router = APIRouter()


def _restore_deleted_user(email: str) -> Optional[dict]:
    """Restore the latest archived user for this email, if one exists."""
    archived = deleted_users_col.find_one(
        {"email": email},
        sort=[("deleted_at", -1)],
    )
    if not archived:
        return None

    restored = dict(archived)
    archived_id = restored.pop("_id", None)
    restored.pop("source_user_id", None)
    restored.pop("deleted_at", None)
    restored.pop("purge_at", None)
    restored.pop("deletion_reason", None)
    restored.pop("retention_days", None)

    result = col.insert_one(restored)
    deleted_users_col.delete_one({"_id": archived_id})
    restored["_id"] = result.inserted_id
    return restored


def _get_google_client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID") or os.getenv("EXPO_PUBLIC_GOOGLE_CLIENT_ID") or ""


def _get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("GOOGLE_ALLOWED_ORIGINS", "")
    return [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]


def _build_auth_response(user: dict, token: str, profile_completed: bool = False):
    serialized = serialize_user(user)
    email = serialized.get("email") or user.get("email") or ""
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Authenticated successfully",
            "data": {
                "token": token,
                "email": email,
                "profile_completed": profile_completed,
                "is_new_user": False,
                "user": serialized,
            },
        },
    )


@router.post("/signup")
async def signup(payload: SignupRequest):
    email = payload.email.strip().lower()
    password = payload.password or ""
    name = payload.name.strip()

    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, password, and name are required")

    try:
        existing_user = col.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        name_parts = name.split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user_data = {
            "email": email,
            "password": hash_(password),
            "auth_provider": "email",
            "role": "free_user",
            "registration_date": datetime.utcnow().date().isoformat(),
            "profile_completed": False,
            "profile": {
                "display_name": name,
                "first_name": first_name,
                "last_name": last_name,
            },
        }

        result = col.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        access_token = create_access_token(result.inserted_id, user_data["role"])
        return _build_auth_response(user_data, access_token, profile_completed=False)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not create account: {exc}")


@router.post("/login")
async def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    password = payload.password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    try:
        user = col.find_one({"email": email})
        if not user:
            user = _restore_deleted_user(email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        stored_password = user.get("password")
        if not stored_password:
            raise HTTPException(status_code=401, detail="This account uses Google sign-in")

        if not verify_hash(stored_password, password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        access_token = create_access_token(user["_id"], user.get("role", "free_user"))
        return _build_auth_response(user, access_token, profile_completed=user.get("profile_completed", False))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not log in: {exc}")


@router.get("/auth/google/client-id")
async def get_google_client_id(origin: str | None = Query(default=None)):
    """Return public Google client ID and whether the requesting origin is allowed."""
    client_id = _get_google_client_id()
    allowed_origins = _get_allowed_origins()
    normalized_origin = (origin or "").strip().rstrip("/")
    origin_allowed = bool(client_id and normalized_origin and normalized_origin in allowed_origins)

    return {
        "success": True,
        "data": {
            "client_id": client_id,
            "origin_allowed": origin_allowed,
            "allowed_origins": allowed_origins,
        },
    }


# =========================
# GOOGLE AUTH LOGIN
# =========================
@router.post("/auth/google")
async def google_auth(payload: dict):
    """
    Handles Google login/signup
    Expects:
    {
        "token": "google_id_token"
    }
    """
    token = payload.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    google_client_id = _get_google_client_id()
    if not google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")

    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            google_client_id
        )

        email = idinfo.get("email")
        name = idinfo.get("name")
        picture = idinfo.get("picture")
        google_id = idinfo.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")

        user = None
        profile_completed = False
        is_new_user = False

        # Check if user exists; if persistence is unavailable, still complete auth so the button works.
        try:
            user = col.find_one({"email": email})
            if not user:
                user = _restore_deleted_user(email)

            if not user:
                # Create new user (minimal)
                user_data = {
                    "email": email,
                    "google_id": google_id,
                    "auth_provider": "google",
                    "role": "free_user",
                    "registration_date": datetime.utcnow().date().isoformat(),
                    "profile_completed": False
                }

                if name:
                    user_data["profile"] = {
                        "display_name": name,
                        "avatar_url": picture or "",
                        "avatar_opt_out": False,
                    }
                elif picture:
                    user_data["profile"] = {
                        "avatar_url": picture,
                        "avatar_opt_out": False,
                    }

                result = col.insert_one(user_data)
                user_id = result.inserted_id
                role = "free_user"
                is_new_user = True

            else:
                user_id = user["_id"]
                role = user.get("role", "free_user")
                profile_completed = user.get("profile_completed", False)

                profile_updates = {}
                existing_profile = user.get("profile") if isinstance(user.get("profile"), dict) else {}
                avatar_opt_out = bool(existing_profile.get("avatar_opt_out"))
                if name and existing_profile.get("display_name") != name:
                    profile_updates["profile.display_name"] = name
                if picture and not avatar_opt_out and existing_profile.get("avatar_url") != picture:
                    profile_updates["profile.avatar_url"] = picture

                if profile_updates:
                    try:
                        col.update_one({"_id": user_id}, {"$set": profile_updates})
                    except (PyMongoError, ServerSelectionTimeoutError):
                        pass

        except (PyMongoError, ServerSelectionTimeoutError):
            user_id = ObjectId()
            role = "free_user"

        # Create JWT
        access_token = create_access_token(user_id, role)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Authenticated successfully",
                "data": {
                    "token": access_token,
                    "email": email,
                    "profile_completed": profile_completed,
                    "is_new_user": is_new_user,
                    "picture": picture or "",
                }
            }
        )

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")


# =========================
# COMPLETE PROFILE (OLD SIGNUP)
# =========================
@router.post("/complete-profile")
async def complete_profile(
    data: SignupRequest,
    user=Depends(get_current_user)
):
    """
    Collect additional user information AFTER Google login
    """

    user_id = user["_id"]

    name = data.name

    if not name:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Name is required"
            }
        )

    # Split name
    name_parts = name.strip().split(maxsplit=1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Demographics
    demographics = data.demographics
    sex = demographics.sex if demographics else None
    gender = demographics.gender if demographics else None
    disability = demographics.disability if demographics else None
    race = demographics.race if demographics else None

    try:
        # Update user instead of creating
        update_data = {
            "first_name": first_name,
            "last_name": last_name,
            "profile": {
                "display_name": f"{first_name} {last_name}".strip(),
                "first_name": first_name,
                "last_name": last_name,
            },
            "sex": sex or "",
            "gender": gender or "",
            "disability": disability or "",
            "race": race or "",
            "profile_completed": True
        }

        # Optional fields (enable when ready)
        # update_data["phone"] = data.phone
        # update_data["linkedin"] = data.linkedin
        # update_data["github"] = data.github
        # update_data["location"] = data.location

        col.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Profile completed successfully"
            }
        )

    except Exception as e:
        print(f"Profile completion error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error"
            }
        )


# =========================
# LOGOUT
# =========================
@router.get("/logout")
def logout():
    """
    JWT logout is handled client-side
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Logged out. Remove token on client."
        }
    )