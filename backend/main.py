"""
Backend file
"""
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import pymongo
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from jwt import PyJWTError
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from bson import ObjectId

"""
Import bcrypt to hash passwords.
"""
import bcrypt


"""
Import datetime used for saving registration date of users
"""
from datetime import datetime, timedelta, timezone

"""
Import jwt used for authentication
Define the jwt algorithm used, which is HS256
Define length of tokens in hours
"""
import jwt
jwt_algo = "HS256"
jwt_expire_minutes = 60 * 2  # 2 hour token
jwt_secret = os.environ.get("JWT_SECRET", "dev-secret")

# Create a FastAPI instance
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)

database = os.environ.get("DATABASE")
try:
    clientdb = pymongo.MongoClient(f"{database}")
    print(f"MongoDB connected: {clientdb.server_info()}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")

db_info = os.environ.get("DATABASE_INFO")
db = clientdb[f'{db_info}']
col = db["users"]

"""
Helper function to hash passwords for security purposes
"""
def hash_(pwd):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt)
    return hashed.decode('utf-8')

"""
Helper function to verify a stored password against one provided by the user
"""
def verify_hash(stored_pwd, provided_pwd):

    stored_pwd = stored_pwd.encode("utf-8")

    return bcrypt.checkpw(provided_pwd.encode("utf-8"), stored_pwd)

"""
Helper function to create a JWT access token for the given user ID
"""
def create_access_token(userID: ObjectId, role: str) -> str:

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(userID),  # subject
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=jwt_expire_minutes)).timestamp()),
        "role": role,
    }

    return jwt.encode(payload, jwt_secret, algorithm=jwt_algo)


class Demographics(BaseModel):
    sex: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[str] = None
    race: Optional[str] = None


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    demographics: Optional[Demographics] = None





class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    positions: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    work_arrangement: Optional[str] = None


class ResumeUpdateRequest(BaseModel):
    resume_file_name: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None


"""
Function that runs when user attempts to login to their account 
The user is required to input the following information:
- email
- password
If the user exists and the password is correct then the login is successful
The server side creates an access token for the session 
"""
@app.post("/login")
async def login(payload: LoginRequest):
    email = payload.email
    password = payload.password

    #missing info
    if not password or not email:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing email or password"
            }
        )

    try:
        user = col.find_one({"email": email})
        #check that user exists in database
        if user is None:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "User does not exist"
                }
            )

        user_id = user.get("_id")
        pwd_hash = user.get("password")

        #check the password against the saved hash in the database
        if not pwd_hash or not verify_hash(pwd_hash, password):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid password."
                }
            )
        #user's role and create access token which is returned to client end along with other necessary info
        role = user.get("role", "free_user")
        access_token = create_access_token(user_id, role)
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "User logged in successfully.",
                "data": {
                    "user_id": str(user_id),
                    "email": email,
                    "role": role,
                    "token": access_token
                }
            }
        )
    #unexpected error
    except:
        print("error")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error."
            }
        )

@app.get("/logout")
def logout(authorization: str = Header(None)):
    #TODO: client side must delete token on its end, in localStorage: localStorage.removeItem("token"); OR if in sessioNStorage: sessionStorage.removeItem("token");
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

        # nothing to do server-side unless you add a blacklist
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Logged out. Delete the token on the client."}
    )

"""
Function that runs when user attempts to create an account 
The user is required to input the following information:
- email
- first name
- last name
- phone number
- linkedin
- github 
- location
- password
All of the above information excluding the email are hashed for security reasons
The user is auto assigned an ID used by the server side 
There are multiple checks to ensure valid parameters are provided,
for example: email requires @ and . to be in it 
"""
@app.post("/signup")
async def signup(payload: SignupRequest):
    email = payload.email
    password = payload.password
    name = (payload.name or "").strip()
    demographics = payload.demographics.dict() if payload.demographics else {}

    """Make sure none of the information provided is blank"""
    if email is None or email == "" or password is None or password == "":
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing information!"
            }
        )

    """Hash the necessary information for security purposes"""
    hashed_pwd = hash_(password)
    reg_date = datetime.utcnow().date().isoformat()  # date of account creation (now)
    role = "free_user"

    """Split name into first/last for profile"""
    first_name = ""
    last_name = ""
    if name:
        parts = name.split()
        first_name = parts[0]
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    """Ensure this email is not already in use"""
    try:
        user = col.find_one({"email": email})
        if user:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Email already in use!"
                }
            )
    except:
        pass

    """Insert information into database"""
    try:
        dic = {
            "email": email,
            "password": hashed_pwd,
            "registration_date": reg_date,
            "role": role,
            "profile": {
                "first_name": first_name,
                "last_name": last_name,
            },
            "demographics": demographics,
            "job_preferences": {
                "positions": [],
                "locations": [],
                "work_arrangement": "any",
            },
            "resume": {
                "resume_file_name": "",
                "extracted_data": {},
            },
        }
        user = col.insert_one(dic)
        user_id = user.inserted_id  # database generated object ID
        access_token = create_access_token(user_id, role)  # create an access token for the user, valid for two hours
        """Return the information to client side"""
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Account created successfully.",
                "data": {
                    "user_id": str(user_id),
                    "email": email,
                    "role": role,
                    "token": access_token
                }
            }
        )
    #failed
    except Exception as e:
        print(f"Signup error: {type(e).__name__}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Database error: {str(e)}"
            }
        )


"""
Deconde/verify a JWT access token and return the user ID 
Raises ValueError if token is invalid/expired/missing required claims
"""
def get_current_user(token: str) -> ObjectId:
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
    if not user:
        return {}
    user = dict(user)
    user["user_id"] = str(user.pop("_id"))
    user.pop("password", None)
    return user


@app.get("/profile")
def read_user(authorization: str = Header(None)):
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
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": serialize_user(user)
            }
        )
    except:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@app.put("/profile")
def update_profile(payload: ProfileUpdateRequest, authorization: str = Header(None)):
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

    try:
        col.update_one({"_id": user_id}, {"$set": {f"profile.{k}": v for k, v in updates.items()}})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Profile updated."
            }
        )
    except:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@app.put("/preferences")
def update_preferences(payload: PreferencesUpdateRequest, authorization: str = Header(None)):
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
    except:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@app.put("/resume")
def update_resume(payload: ResumeUpdateRequest, authorization: str = Header(None)):
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
                "message": "No resume data provided."
            }
        )

    try:
        col.update_one({"_id": user_id}, {"$set": {f"resume.{k}": v for k, v in updates.items()}})
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Resume saved."
            }
        )
    except:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )

@app.get("/jobs")
def read_jobs():
    return {"message": "Hello, World"}

@app.get("/resume_builder")
def read_resume_builder():
    return {"message": "Hello, World"}

@app.get("/about")
def read_about():
    return {"message": "Hello, World"}

@app.get("/cl_builder")
def read_contact():
    return {"message": "Hello, World"}