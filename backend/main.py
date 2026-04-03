"""
Backend file
"""
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import json
import pymongo
import os

from jwt import PyJWTError

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
jwt_secret = os.environ.get("JWT_SECRET")

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

    return jwt.encode(payload, jwt_secret, algorithm=jwt_algo)



"""
Function that runs when user attempts to login to their account 
The user is required to input the following information:
- email
- password
If the user exists and the password is correct then the login is successful
The server side creates an access token for the session 
"""
@app.get("/login")
async def login(request: Request):
    #user input
    form = await request.form()
    email = form.get("email")
    password = form.get("password")

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
        user = col.find({"email": email})
        #check that user exists in database
        if user is None:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "User does not exist"
                }
            )

        user_id = user.inserted_id #the user's ID
        pwd_hash = user['password']

        #check the password against the saved hash in the database
        if not verify_hash(pwd_hash, password):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid password."
                }
            )
        #user's role and create access token which is returned to client end along with other necessary info
        role = user['role']
        access_token = create_access_token(user_id, role)
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "User logged in successfully.",
                "data": {
                    "user_id": user_id,
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
    gender = form.get("gender")
    indigenous = form.get("indigenous")
    disability = form.get("disability")
    lgbtq = form.get("lgbtq")
    minority = form.get("minority")

    genders = ["Man", "Woman", "Non-Binary", "Two-Spirit", "Another Gender", "I do not wish to answer"]
    indigenous_l = ["Yes", "No", "I do not wish to answer"]
    lgbtq_l = ["Yes", "No", "I do not wish to answer"]
    disability_l = ["Yes", "No", "I do not wish to answer"]
    vis_mino_l = ["Yes", "No", "I do not wish to answer"]

    """Make sure none of the information provided is blank"""
    if email is None or email == "" or first_name is None or first_name == "" or last_name is None or last_name == "" or phone is None or phone == "" or linkedin is None or linkedin == "" or location is None or location == "" or github is None or github == "" or password is None or password == "" or gender not in genders or indigenous not in indigenous_l or disability not in disability_l or minority not in vis_mino_l or lgbtq not in lgbtq_l:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Missing information!"
            }
        )

    """Ensure proper email information"""
    if "@" not in email or "." not in email or " " in email:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Invalid email!"
            }
        )

    """First and last names should not have spaces"""
    if " " in first_name or " " in last_name:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Invalid first or last name!"
            }
        )

    """Hash the necessary information for security purposes"""
    hashed_pwd = hash_(password)
    hashed_fname = hash_(first_name)
    hashed_lname = hash_(last_name)
    hashed_phone = hash_(phone)
    hashed_linkedin = hash_(linkedin)
    hashed_github = hash_(github)
    hashed_location = hash_(location)
    hashed_gender = hash_(gender)
    hashed_indigenous = hash_(indigenous)
    hashed_disability = hash_(disability)
    hashed_minority = hash_(minority)
    hashed_lgbtq = hash_(lgbtq)
    reg_date = datetime.utcnow().date().isoformat()  # date of account creation (now)
    role = "free_user"

    """Ensure this email is not already in use"""
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

    """Insert information into database"""
    try:
        dic = {"email":email, "password":hashed_pwd, "first_name": hashed_fname, "last_name": hashed_lname, "phone": hashed_phone,
           "linkedin": hashed_linkedin, "github": hashed_github, "location": hashed_location, "registration_date": reg_date, "role": role, "gender": hashed_gender, "indigenous": hashed_indigenous, "disability": hashed_disability, "minority": hashed_disability, "lgbtq": hashed_lgbtq}
        user = col.insert_one(dic)
        user_id = user.inserted_id #database generated object ID
        access_token = create_access_token(user_id, role) #create an access token for the user, valid for two hours
        """Return the information to client side"""
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
    #failed
    except:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Server side error!"
            }
        )


"""
Deconde/verify a JWT access token and return the user ID 
Raises ValueError if token is invalid/expired/missing required claims
"""
def get_current_user(token: str) -> int:
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
        return int(sub)
    except (TypeError, ValueError):
        raise ValueError("Token 'sub' claim is not a valid integer")


@app.get("/profile")
def read_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]  # everything after "Bearer "
    user_id = get_current_user(token)

    try:
        col.find_one({"user_id": user_id})
        # TODO: finish code
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
