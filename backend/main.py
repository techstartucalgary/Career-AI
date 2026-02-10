"""
Backend file
"""
from fastapi import FastAPI, Request, Header, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import pymongo
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
import tempfile
from pathlib import Path

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

# Import AI routes
from ai_routes import router as ai_router

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI routes
app.include_router(ai_router)

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
    name: str
    demographics: Optional[Demographics] = None
    
    # TODO: Re-enable when frontend collects these fields
    # first_name: str
    # last_name: str
    # phone: str
    # linkedin: str
    # github: str
    # location: str
    # indigenous: str
    # disability: str
    # lgbtq: str
    # minority: str





class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    positions: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    work_arrangement: Optional[str] = None


class ResumeUpdateRequest(BaseModel):
    resume_file_name: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None


class OnboardingCompleteRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    linkedin: str
    github: Optional[str] = None
    website: Optional[str] = None
    location: str
    positions: List[str]
    locations: List[str]
    work_arrangement: str


class DemographicsUpdateRequest(BaseModel):
    sex: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[str] = None
    race: Optional[str] = None


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
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
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
async def signup(data: SignupRequest):
    email = data.email
    password = data.password
    name = data.name
    
    # Split name into first/last
    name_parts = name.strip().split(maxsplit=1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Extract demographics if provided
    demographics = data.demographics
    sex = demographics.sex if demographics else None
    gender = demographics.gender if demographics else None
    disability = demographics.disability if demographics else None
    race = demographics.race if demographics else None
    
    # TODO: Re-enable these fields when frontend collects them
    # phone = data.phone
    # linkedin = data.linkedin
    # github = data.github
    # location = data.location
    # indigenous = data.indigenous
    # lgbtq = data.lgbtq
    # minority = data.minority

    """Validate required fields"""
    if not all([email, password, name]):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing required information!"
            }
        )
    
    # TODO: Re-enable field validation when frontend collects additional fields
    # genders = ["Man", "Woman", "Non-Binary", "Two-Spirit", "Another Gender", "I do not wish to answer"]
    # indigenous_l = ["Yes", "No", "I do not wish to answer"]
    # lgbtq_l = ["Yes", "No", "I do not wish to answer"]
    # disability_l = ["Yes", "No", "I do not wish to answer"]
    # vis_mino_l = ["Yes", "No", "I do not wish to answer"]
    # 
    # if not all([phone, linkedin, location, github]):
    #     return JSONResponse(
    #         status_code=400,
    #         content={
    #             "success": False,
    #             "message": "Missing required information!"
    #         }
    #     )
    # 
    # if gender not in genders or indigenous not in indigenous_l or disability not in disability_l or minority not in vis_mino_l or lgbtq not in lgbtq_l:
    #     return JSONResponse(
    #         status_code=400,
    #         content={
    #             "success": False,
    #             "message": "Invalid selection for gender or demographic fields!"
    #         }
    #     )

    """Hash the necessary information for security purposes"""
    hashed_pwd = hash_(password)
    hashed_fname = hash_(first_name)
    hashed_lname = hash_(last_name)
    hashed_sex = hash_(sex) if sex else None
    hashed_gender = hash_(gender) if gender else None
    hashed_disability = hash_(disability) if disability else None
    hashed_race = hash_(race) if race else None
    
    # TODO: Re-enable when frontend collects these fields
    # hashed_phone = hash_(phone)
    # hashed_linkedin = hash_(linkedin)
    # hashed_github = hash_(github)
    # hashed_location = hash_(location)
    # hashed_indigenous = hash_(indigenous)
    # hashed_lgbtq = hash_(lgbtq)
    # hashed_minority = hash_(minority)
    
    reg_date = datetime.utcnow().date().isoformat()
    role = "free_user"

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
    except Exception as e:
        print(f"Signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        pass

    """Insert information into database"""
    try:
        user_data = {
            "email": email,
            "password": hashed_pwd,
            "first_name": hashed_fname,
            "last_name": hashed_lname,
            "registration_date": reg_date,
            "role": role
        }

        display_name = f"{first_name} {last_name}".strip()
        if display_name:
            user_data["profile"] = {
                "display_name": display_name,
                "first_name": first_name,
                "last_name": last_name,
            }
        
        # TODO: Re-enable when frontend collects these fields
        # user_data["phone"] = hashed_phone
        # user_data["linkedin"] = hashed_linkedin
        # user_data["github"] = hashed_github
        # user_data["location"] = hashed_location
        # user_data["indigenous"] = hashed_indigenous
        # user_data["lgbtq"] = hashed_lgbtq
        # user_data["minority"] = hashed_minority
        
        # Add demographics (always initialize, even if empty)
        user_data["sex"] = hashed_sex or ""
        user_data["gender"] = hashed_gender or ""
        user_data["disability"] = hashed_disability or ""
        user_data["race"] = hashed_race or ""
        
        user = col.insert_one(user_data)
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
    profile = user.get("profile") or {}

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


@app.post("/onboarding/complete")
def complete_onboarding(payload: OnboardingCompleteRequest, authorization: str = Header(None)):
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
    except Exception as e:
        print(f"Resume save error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


@app.put("/demographics")
def update_demographics(payload: DemographicsUpdateRequest, authorization: str = Header(None)):
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

@app.post("/resume/parse")
async def parse_resume_file(
    resume_file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Parse resume file and extract structured data"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        # Import here to avoid circular imports
        from ai_service.service import ResumeTailoringService
        from ai_service.parser import ResumeParser
        import base64
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        # Write uploaded file to temp location
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        # Parse resume
        parser = ResumeParser()
        resume_text = parser.extract_text_from_pdf(str(temp_file_path))
        parsed_resume = parser.parse_resume_text(resume_text)
        
        # Extract header info
        header = parsed_resume.header
        
        # Prepare extracted data for response
        extracted_data = {
            "name": header.name or "",
            "email": header.email or "",
            "phone": header.phone or "",
            "linkedin": header.linkedin or "",
            "github": header.github or "",
            "location": header.location or "",
        }
        
        # Parse first/last name from full name
        name_parts = (header.name or "").strip().split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        # Auto-save to user profile
        if first_name or last_name:
            display_name = f"{first_name} {last_name}".strip()
            update_data = {
                "profile.display_name": display_name,
                "profile.first_name": first_name,
                "profile.last_name": last_name,
            }
            
            if header.phone:
                update_data["profile.phone"] = header.phone
            if header.linkedin:
                update_data["profile.linkedin"] = header.linkedin
            if header.github:
                update_data["profile.github"] = header.github
            if header.location:
                update_data["profile.location"] = header.location
            
            # Save resume file as base64
            with open(temp_file_path, "rb") as f:
                resume_bytes = f.read()
                resume_base64 = base64.b64encode(resume_bytes).decode("utf-8")
            
            update_data["resume.file_name"] = resume_file.filename
            update_data["resume.file_data"] = resume_base64
            update_data["resume.uploaded_at"] = datetime.utcnow().isoformat()
            
            col.update_one({"_id": user_id}, {"$set": update_data})
        
        # Clean up temp file
        try:
            Path(temp_file_path).unlink()
        except:
            pass
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": extracted_data
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Resume parsing failed: {str(e)}"
            }
        )

@app.post("/resume/upload")
async def upload_resume_file(
    resume_file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Upload resume file without parsing or auto-filling profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_id = get_current_user(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        import base64
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = Path(temp_dir) / f"resume_{datetime.now().timestamp()}.pdf"
        
        # Write uploaded file to temp location
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await resume_file.read())
        
        # Save resume file as base64
        with open(temp_file_path, "rb") as f:
            resume_bytes = f.read()
            resume_base64 = base64.b64encode(resume_bytes).decode("utf-8")
        
        # Store without parsing or auto-fill
        update_data = {
            "resume.file_name": resume_file.filename,
            "resume.file_data": resume_base64,
            "resume.uploaded_at": datetime.utcnow().isoformat()
        }
        
        col.update_one({"_id": user_id}, {"$set": update_data})
        
        # Clean up temp file
        try:
            Path(temp_file_path).unlink()
        except:
            pass
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Resume uploaded successfully",
                "data": {
                    "file_name": resume_file.filename
                }
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Resume upload failed: {str(e)}"
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