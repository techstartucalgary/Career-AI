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

def build_terms(keywords: List[str]) -> str:
    cleaned = [k.strip() for k in keywords if k.strip()]
    if not cleaned:
        raise ValueError("At least one keyword is required")
    # include intern terms automatically
    return f"({' OR '.join(cleaned)}) AND (intern OR internship OR co-op OR coop)"


async def fetch_jobs_json(
    keywords: List[str],
    location: str = "Calgary",
    page: int = 1,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise HTTPException(
            status_code=500,
            detail="Missing ADZUNA_APP_ID or ADZUNA_APP_KEY environment variables."
        )

    what = build_terms(keywords)

    url = f"https://api.adzuna.com/v1/api/jobs/ca/search/{page}"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": limit,
        "what": what,
        "where": location,
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, params=params)

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Upstream jobs API error",
                "status_code": resp.status_code,
                "body": resp.text[:500],
            },
        )

    data = resp.json()

    jobs = []
    for item in data.get("results", []):
        jobs.append({
            "title": item.get("title"),
            "company": (item.get("company") or {}).get("display_name"),
            "location": (item.get("location") or {}).get("display_name"),
            "description": item.get("description"),
            "url": item.get("redirect_url"),
            "posted_at": item.get("created"),
            "contract_time": item.get("contract_time"),
            "contract_type": item.get("contract_type"),
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
            "source": "adzuna"
        })

    return jobs


@app.get("/api/jobs")
async def get_jobs(
    keywords: List[str] = Query(..., description="Repeat param: ?keywords=software&keywords=engineering"),
    location: str = Query("Calgary"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    jobs = await fetch_jobs_json(
        keywords=keywords,
        location=location,
        page=page,
        limit=limit,
    )
    return {
        "count": len(jobs),
        "jobs": jobs
    }

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