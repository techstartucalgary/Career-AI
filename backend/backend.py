"""
Backend file
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import json
import pymongo
import os

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

# Create a FastAPI instance
app = FastAPI()

database = os.environ.get("DATABASE")
clientdb = pymongo.MongoClient(f"{database}")
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
def create_access_token(userID: int, role: str) -> str:

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(userID),  # subject
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=jwt_expire_minutes)).timestamp()),
        "role": role,
    }

    return jwt.encode(payload, algorithm=jwt_algo)

@app.get("/login")
def login():
    return {"message": "Hello, World"}

@app.get("/logout")
def logout():
    return {"message": "Hello, World"}

@app.get("/signup")
async def signup(request: Request):
    form = await request.form()
    email = form.get("email")
    first_name = form.get("first_name")
    last_name = form.get("last_name")
    phone = form.get("phone")
    linkedin = form.get("linkedin")
    github = form.get("github")
    location = form.get("location")
    password = form.get("password")

    if email is None or email == "" or first_name is None or first_name == "" or last_name is None or last_name == "" or phone is None or phone == "" or linkedin is None or linkedin == "" or location is None or location == "" or github is None or github == "" or password is None or password == "":
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing information!"
            }
        )

    if "@" not in email or "." not in email or " " in email:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Invalid email!"
            }
        )

    if " " in first_name or " " in last_name:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Invalid first or last name!"
            }
        )

    hashed_pwd = hash_(password)
    hashed_fname = hash_(first_name)
    hashed_lname = hash_(last_name)
    hashed_phone = hash_(phone)
    hashed_linkedin = hash_(linkedin)
    hashed_github = hash_(github)
    hashed_location = hash_(location)
    reg_date = datetime.utcnow().date().isoformat()  # date of account creation (now)
    role = "free_user"

    try:
        user = col.find({"email": email})
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

    try:
        dic = {"email":email, "password":hashed_pwd, "first_name": hashed_fname, "last_name": hashed_lname, "phone": hashed_phone,
           "linkedin": hashed_linkedin, "github": hashed_github, "location": hashed_location, "registration_date": reg_date, "role": role}
        user = col.insert_one(dic)
        user_id = user.inserted_id
        access_token = create_access_token(user_id, role)
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Account created successfully.",
                "data": {
                    "user_id": user_id,
                    "email": email,
                    "role": role,
                    "token": access_token
                }
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



def get_current_user():
    return {"message": "Hello, World"}

@app.get("/profile")
def read_user():
    return {"message": "Hello, World"}

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
