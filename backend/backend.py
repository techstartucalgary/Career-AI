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
