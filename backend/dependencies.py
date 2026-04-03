"""
Shared dependencies and utility functions
"""
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from jwt import PyJWTError
from bson import ObjectId

# JWT Configuration
jwt_algo = "HS256"
jwt_expire_minutes = 60 * 24 * 7  # 7 day token
jwt_secret = os.environ.get("JWT_SECRET", "dev-secret")


def hash_(pwd):
    """
    Helper function to hash passwords for security purposes
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_hash(stored_pwd, provided_pwd):
    """
    Helper function to verify a stored password against one provided by the user
    """
    stored_pwd = stored_pwd.encode("utf-8")
    return bcrypt.checkpw(provided_pwd.encode("utf-8"), stored_pwd)


def create_access_token(userID: ObjectId, role: str) -> str:
    """
    Helper function to create a JWT access token for the given user ID
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(userID),  # subject
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=jwt_expire_minutes)).timestamp()),
        "role": role,
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_algo)


def get_current_user(token: str) -> ObjectId:
    """
    Decode/verify a JWT access token and return the user ID 
    Raises ValueError if token is invalid/expired/missing required claims
    """
    try:
        payload = jwt.decode(
            token,
            key=jwt_secret,
            algorithms=[jwt_algo],
            options={"require": ["sub", "exp", "iat"]},
        )
    except PyJWTError as e:
        raise ValueError(f"Invalid or expired token: {e}")

    sub = payload.get("sub")
    if sub is None:
        raise ValueError("Token missing 'sub' claim")

    try:
        return ObjectId(sub)
    except (TypeError, ValueError):
        raise ValueError("Token 'sub' claim is not a valid ObjectId")


def serialize_user(user: dict) -> dict:
    """
    Serialize user document for API response
    """
    if not user:
        return {}
    user = dict(user)
    user["user_id"] = str(user.pop("_id"))
    user.pop("password", None)
    profile = user.get("profile") or {}
    avatar_url = profile.get("avatar_url") if isinstance(profile, dict) else None

    def is_bcrypt(value: object) -> bool:
        return isinstance(value, str) and value.startswith("$2")

    if profile.get("display_name"):
        user["name"] = profile.get("display_name")
    else:
        first_name = profile.get("first_name") or ("" if is_bcrypt(user.get("first_name")) else user.get("first_name")) or ""
        last_name = profile.get("last_name") or ("" if is_bcrypt(user.get("last_name")) else user.get("last_name")) or ""
        combined_name = f"{first_name} {last_name}".strip()
        if combined_name:
            user["name"] = combined_name

    if avatar_url:
        user["avatar_url"] = avatar_url
        user["picture"] = avatar_url

    # Signup stores sex/gender/disability/race as bcrypt; PUT /demographics stores plaintext.
    # Never expose hashes to the client — they won't match form options and look "empty".
    for demo_key in ("sex", "gender", "disability", "race"):
        v = user.get(demo_key)
        if is_bcrypt(v):
            user[demo_key] = ""

    # Stable shape for clients (onboarding uses nested job_preferences.*)
    jp = user.get("job_preferences")
    if not isinstance(jp, dict):
        jp = {}
    pos = jp.get("positions")
    loc = jp.get("locations")
    user["job_preferences"] = {
        "positions": pos if isinstance(pos, list) else [],
        "locations": loc if isinstance(loc, list) else [],
        "work_arrangement": jp.get("work_arrangement") or "any",
    }

    return user
