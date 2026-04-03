"""
Backend file - Refactored for better organization
"""
import os
from typing import List, Dict, Any

import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path
import requests

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
from github_routes import router as github_router
from linkedin.linkedin_routes import router as linkedin_router

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
app.include_router(github_router)
app.include_router(linkedin_router)



api_key = os.getenv("SCRAPEDOG")
url = "https://api.scrapingdog.com/jobs"

params = {
    "api_key": f"{api_key}",
    "location": "Calgary",
    "exp_level": "internship"
}

@app.get("/api/jobs")
async def get_jobs():
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        print(data)
        return data
    else:
        print(f"Request failed with status code: {response.status_code}")



apify_token = os.getenv("APIFY_TOKEN")
dataset_id = "T8ZwQlSic6k084UlR"
apify_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"

apify_params = {
    "token": f"{apify_token}"
}

@app.get("/api/indeed-jobs")
async def get_indeed_jobs():
    response = requests.get(apify_url, params=apify_params)

    if response.status_code == 200:
        data = response.json()

        jobs = []
        for job in data:
            jobs.append({
                "title": job.get("title"),
                "company": job.get("companyName") or job.get("company"),
                "location": job.get("location"),
                "salary": job.get("salary"),
                "type": job.get("jobType"),
                "posted_at": job.get("postedAt"),
                "description": job.get("description"),
                "url": job.get("url") or job.get("jobUrl"),
                "source": "indeed"
            })

        return {
            "success": True,
            "count": len(jobs),
            "jobs": jobs
        }
    else:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Apify request failed with status code: {response.status_code} - {response.text}"
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