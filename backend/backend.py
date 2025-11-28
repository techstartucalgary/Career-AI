"""
Backend file
"""
from fastapi import FastAPI
import json

# Create a FastAPI instance
app = FastAPI()

# Define a path operation
@app.get("/start")
def read_root():
    return {"message": "Hello, World"}

@app.get("/resume")
def read_item():
    try:
        with open('data.json', 'r') as f:
            data = json.load(f)

        return data
    except FileNotFoundError:
        return("Error: 'data.json' not found. Please ensure the file exists.")
    except json.JSONDecodeError:
        return("Error: Invalid JSON format in 'data.json'.")

@app.get("/login")
def login():
    return {"message": "Hello, World"}

@app.get("/logout")
def logout():

    return {"message": "Logged out"}

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
