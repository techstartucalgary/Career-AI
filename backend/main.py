"""
Backend file - Refactored for better organization
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import routers from modular files
from ai_routes import router as ai_router
from auth import router as auth_router
from users import router as users_router
from resume import router as resume_router
from interview_routes import router as interview_router
from mock_interview_routes import router as mock_interview_router
from speech_routes import router as speech_router

# Create a FastAPI instance
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(mock_interview_router)
app.include_router(speech_router)


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