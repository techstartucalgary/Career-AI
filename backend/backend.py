"""
Backend file
"""
from fastapi import FastAPI
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
def hash_password(pwd):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt)
    return hashed.decode('utf-8')

"""
Helper function to verify a stored password against one provided by the user
"""
def verify_password(stored_pwd, provided_pwd):

    stored_pwd = stored_pwd.encode("utf-8")

    return bcrypt.checkpw(provided_pwd.encode("utf-8"), stored_pwd)

@app.get("/login")
def login():
    return {"message": "Hello, World"}

@app.get("/logout")
def logout():
    return {"message": "Hello, World"}

@app.get("/signup")
def signup():
    return {"message": "Hello, World"}

@app.get("/logout")
def logout():

    return {"message": "Logged out"}

def get_current_user():
    return {"message": "Hello, World"}

@app.get("/profile")
def read_user():
    return {"message": "Hello, World"}

@app.get("/signup")
def read_signup():
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
