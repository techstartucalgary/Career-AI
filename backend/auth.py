"""
Authentication routes (login, signup, logout)
"""
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime

from models import SignupRequest, LoginRequest
from database import col
from dependencies import hash_, verify_hash, create_access_token

router = APIRouter()


@router.post("/login")
async def login(payload: LoginRequest):
    """
    Function that runs when user attempts to login to their account 
    The user is required to input the following information:
    - email
    - password
    If the user exists and the password is correct then the login is successful
    The server side creates an access token for the session 
    """
    email = payload.email
    password = payload.password

    # Missing info
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
        # Check that user exists in database
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

        # Check the password against the saved hash in the database
        if not pwd_hash or not verify_hash(pwd_hash, password):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid password."
                }
            )
        # User's role and create access token which is returned to client end along with other necessary info
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
    # Unexpected error
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


@router.get("/logout")
def logout(authorization: str = Header(None)):
    """
    Logout endpoint
    TODO: client side must delete token on its end, in localStorage: localStorage.removeItem("token"); 
    OR if in sessionStorage: sessionStorage.removeItem("token");
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    # Nothing to do server-side unless you add a blacklist
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Logged out. Delete the token on the client."}
    )


@router.post("/signup")
async def signup(data: SignupRequest):
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

    # Validate required fields
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

    # Hash the necessary information for security purposes
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

    # Ensure this email is not already in use
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

    # Insert information into database
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
        # Return the information to client side
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
    # Failed
    except Exception as e:
        print(f"Signup error: {type(e).__name__}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Database error: {str(e)}"
            }
        )
