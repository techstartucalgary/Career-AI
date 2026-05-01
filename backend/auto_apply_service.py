"""
Auto Apply service — Autonomous job application agent with AI-powered matching,
multi-source discovery, intelligent cover letter generation, and pipeline management.
"""
import os
import json
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
import httpx
import traceback

from database import db


# ──────────────────────────────────────────────
# Collection accessors
# ──────────────────────────────────────────────

def get_pipeline_col():
    if db is None:
        raise RuntimeError("Database not connected")
    return db["auto_apply_pipeline"]


def get_activity_col():
    if db is None:
        raise RuntimeError("Database not connected")
    return db["auto_apply_activity"]


def get_users_col():
    if db is None:
        raise RuntimeError("Database not connected")
    return db["users"]


def get_agent_state_col():
    if db is None:
        raise RuntimeError("Database not connected")
    return db["agent_state"]


# ──────────────────────────────────────────────
# LLM helper
# ──────────────────────────────────────────────

def _get_llm(temperature=0.3):
    """Get the Gemini LLM provider."""
    from ai_service.llm import get_llm_provider
    from ai_service.config import LLM_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL
    return get_llm_provider(
        provider=LLM_PROVIDER,
        api_key=GEMINI_API_KEY,
        model_name=GEMINI_MODEL,
        temperature=temperature,
    )


def _invoke_llm(prompt: str, temperature=0.3) -> str:
    """Invoke LLM and return text response."""
    from langchain_core.messages import HumanMessage
    llm = _get_llm(temperature)
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip()


# ──────────────────────────────────────────────
# Settings
# ──────────────────────────────────────────────

DEFAULT_SETTINGS = {
    "positions": [],
    "locations": [],
    "work_arrangement": "any",
    "match_threshold": 60,
    "auto_generate_cover_letter": True,
    "daily_apply_limit": 10,
    "agent_enabled": False,
    "auto_apply_enabled": False,
    "search_interval_hours": 6,
    "excluded_companies": [],
    "follow_up_days": 7,
}


def get_settings(user_id: ObjectId) -> dict:
    users = get_users_col()
    user = users.find_one({"_id": user_id}, {"auto_apply_settings": 1})
    if not user or "auto_apply_settings" not in user:
        return {**DEFAULT_SETTINGS}
    merged = {**DEFAULT_SETTINGS, **user["auto_apply_settings"]}
    return merged


def update_settings(user_id: ObjectId, settings: dict) -> dict:
    users = get_users_col()
    current = get_settings(user_id)
    for key, value in settings.items():
        if value is not None:
            current[key] = value
    users.update_one(
        {"_id": user_id},
        {"$set": {"auto_apply_settings": current}},
    )
    return current


# ──────────────────────────────────────────────
# AI-Powered Match Scoring (Gemini)
# ──────────────────────────────────────────────

async def score_job_match_ai(user_profile: dict, job: dict) -> dict:
    """
    Score a job match using Gemini for intelligent analysis.
    Returns detailed breakdown with tier, flags, and recommendation.
    Falls back to heuristic scoring if LLM fails.
    """
    try:
        # Build candidate info, handling sparse profiles gracefully
        candidate_skills = user_profile.get('skills', [])
        candidate_experience = user_profile.get('experience_summary', 'Not provided')
        candidate_education = user_profile.get('education', 'Not provided')
        has_detailed_profile = bool(candidate_skills) or (candidate_experience != 'Not provided' and candidate_experience != '[]')

        prompt = f"""You are a career matching expert. Score how well this job matches what the candidate is looking for.

IMPORTANT SCORING RULES:
- The PRIMARY factor is role alignment: does the job title/description match what the candidate wants?
- If the job title closely matches the candidate's target roles, the total_score should be at least 70.
- If skills/experience data is sparse or empty, score those categories at their MIDPOINT (not zero).
- Location match should be generous: same city = full points, same province/state = 80%, remote = 80%.
- For intern/entry-level roles, do NOT penalize for lack of experience — that's expected.

Return ONLY valid JSON (no markdown, no code fences):
{{
  "total_score": <0-100>,
  "breakdown": {{
    "role_alignment": {{"score": <0-35>, "reasoning": "<1 sentence>"}},
    "skills_match": {{"score": <0-25>, "reasoning": "<1 sentence>", "matched": [], "missing": []}},
    "location_match": {{"score": <0-15>, "reasoning": "<1 sentence>"}},
    "experience_match": {{"score": <0-10>, "reasoning": "<1 sentence>"}},
    "company_fit": {{"score": <0-10>, "reasoning": "<1 sentence>"}},
    "growth_potential": {{"score": <0-5>, "reasoning": "<1 sentence>"}}
  }},
  "flags": [],
  "tier": <1|2|3|4>,
  "recommendation": "apply" | "skip" | "stretch",
  "one_line_rationale": "<why>"
}}

Tier guide: 1 = perfect fit (85+), 2 = strong (70-84), 3 = stretch (55-69), 4 = weak (<55)

JOB:
Title: {job.get('title', 'N/A')}
Company: {job.get('company', 'N/A')}
Location: {job.get('location', 'N/A')}
Description: {(job.get('description') or '')[:3000]}
Salary: {job.get('salary_min', 'N/A')} - {job.get('salary_max', 'N/A')}

CANDIDATE:
Target roles: {user_profile.get('positions', [])}
Preferred locations: {user_profile.get('locations', [])}
Work arrangement: {user_profile.get('work_arrangement', 'any')}
Skills: {candidate_skills if candidate_skills else 'Not provided — score skills_match at midpoint'}
Experience: {candidate_experience if has_detailed_profile else 'Not provided — score experience_match at midpoint'}
Education: {candidate_education if candidate_education != '[]' else 'Not provided'}"""

        response_text = _invoke_llm(prompt, temperature=0.2)

        # Clean potential markdown fences
        cleaned = response_text
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        score_data = json.loads(cleaned)
        return score_data

    except Exception as e:
        print(f"AI scoring failed, falling back to heuristic: {e}")
        return score_job_match_heuristic(user_profile, job)


def score_job_match_heuristic(user_profile: dict, job: dict) -> dict:
    """Fallback heuristic scoring when LLM is unavailable."""
    flags = []

    user_positions = [p.lower() for p in (user_profile.get("positions") or [])]
    job_title = (job.get("title") or "").lower()
    job_desc = (job.get("description") or "").lower()

    # Role alignment (0-35)
    role_score = 10  # base
    for pos in user_positions:
        if pos in job_title:
            role_score = 35
            break
        words = [w for w in pos.split() if len(w) > 3]
        matched_words = sum(1 for w in words if w in job_title)
        if matched_words >= 2:
            role_score = 30
            break
        elif matched_words >= 1:
            role_score = 20
            break

    # Skills match (0-25) — give midpoint if no skills data
    user_skills = user_profile.get("skills") or []
    if user_skills:
        matched = sum(1 for s in user_skills if s.lower() in job_desc)
        skills_score = min(int(matched / max(len(user_skills), 1) * 25), 25)
    else:
        skills_score = 13  # midpoint

    # Location match (0-15)
    location_score = 5  # base
    user_locations = [l.lower() for l in (user_profile.get("locations") or [])]
    job_location = (job.get("location") or "").lower()
    for loc in user_locations:
        loc_city = loc.split(",")[0].strip()
        if loc_city in job_location:
            location_score = 15
            break

    # Experience (0-10) — midpoint for interns
    exp_score = 5

    # Company fit (0-10)
    company_score = 5

    # Growth (0-5)
    growth_score = 3

    total = min(role_score + skills_score + location_score + exp_score + company_score + growth_score, 100)
    tier = 4 if total < 55 else 3 if total < 70 else 2 if total < 85 else 1

    return {
        "total_score": total,
        "breakdown": {
            "role_alignment": {"score": role_score, "reasoning": "Heuristic title match"},
            "skills_match": {"score": skills_score, "reasoning": "Heuristic keyword match", "matched": [], "missing": []},
            "location_match": {"score": location_score, "reasoning": "Heuristic location match"},
            "experience_match": {"score": exp_score, "reasoning": "Default midpoint"},
            "company_fit": {"score": company_score, "reasoning": "Default"},
            "growth_potential": {"score": growth_score, "reasoning": "Default"},
        },
        "flags": flags,
        "tier": tier,
        "recommendation": "apply" if total >= 70 else "stretch" if total >= 55 else "skip",
        "one_line_rationale": f"Heuristic score: {total}/100",
    }


# ──────────────────────────────────────────────
# Scam Detection
# ──────────────────────────────────────────────

def detect_scam_heuristic(job: dict) -> dict:
    """Quick heuristic scam detection."""
    flags = []
    risk = "safe"
    desc = (job.get("description") or "").lower()

    scam_phrases = [
        "pay for training", "send money", "wire transfer", "processing fee",
        "work from home $", "make $$$", "guaranteed income", "no experience needed",
        "social security", "bank account details", "personal information required",
    ]
    for phrase in scam_phrases:
        if phrase in desc:
            flags.append(f"Contains suspicious phrase: '{phrase}'")
            risk = "suspicious"

    if not job.get("company") or job.get("company", "").strip() == "":
        flags.append("No company name listed")
        risk = "suspicious"

    if job.get("salary_max") and job.get("salary_min"):
        if job["salary_max"] > 500000:
            flags.append("Unrealistic salary")
            risk = "suspicious"

    return {"risk": risk, "flags": flags}


# ──────────────────────────────────────────────
# Multi-Source Job Discovery
# ──────────────────────────────────────────────

async def _search_adzuna(keywords: List[str], location: str) -> List[dict]:
    """Search Adzuna job API."""
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:

        return []

    cleaned = [k.strip() for k in keywords if k.strip()]
    if not cleaned:

        return []

    # Split multi-word positions into OR queries for broader results
    # e.g. ["Software Developer Intern"] -> "Software Developer Intern"
    # Also add individual significant words as OR alternatives
    all_terms = []
    for k in cleaned:
        all_terms.append(k)  # Full phrase
    what = " ".join(all_terms)

    # Strip province/state abbreviation for Adzuna (e.g. "Calgary, AB" -> "Calgary")
    search_location = location.split(",")[0].strip() if location else ""

    url = "https://api.adzuna.com/v1/api/jobs/ca/search/1"
    params = {
        "app_id": app_id, "app_key": app_key,
        "results_per_page": 50, "what": what,
        "where": search_location, "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, params=params)
        if resp.status_code >= 400:
            return []
        data = resp.json()
    except Exception as e:
        return []

    jobs = []
    for item in data.get("results", []):
        jobs.append({
            "job_id": str(item.get("id") or item.get("redirect_url", "")),
            "title": item.get("title"),
            "company": (item.get("company") or {}).get("display_name"),
            "location": (item.get("location") or {}).get("display_name"),
            "description": item.get("description"),
            "url": item.get("redirect_url"),
            "posted_at": item.get("created"),
            "contract_time": item.get("contract_time"),
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
            "source": "adzuna",
        })
    return jobs


async def _search_serpapi(keywords: List[str], location: str) -> List[dict]:
    """Search Google Jobs via SerpAPI."""
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return []

    query = " ".join(keywords[:3])
    params = {
        "engine": "google_jobs",
        "q": query,
        "location": location,
        "api_key": api_key,
        "num": 20,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get("https://serpapi.com/search.json", params=params)
        if resp.status_code >= 400:
            return []
        data = resp.json()
    except Exception:
        return []

    jobs = []
    for item in data.get("jobs_results", []):
        job_id = item.get("job_id") or f"serp_{hash(item.get('title', '') + item.get('company_name', ''))}"
        jobs.append({
            "job_id": str(job_id),
            "title": item.get("title"),
            "company": item.get("company_name"),
            "location": item.get("location"),
            "description": item.get("description"),
            "url": item.get("related_links", [{}])[0].get("link") if item.get("related_links") else None,
            "posted_at": item.get("detected_extensions", {}).get("posted_at"),
            "salary_min": None,
            "salary_max": None,
            "source": "google_jobs",
        })
    return jobs


async def generate_search_queries(user_profile: dict) -> List[str]:
    """Use Gemini to generate diverse job search queries from user profile."""
    try:
        positions = user_profile.get("positions") or ["software developer"]
        locations = user_profile.get("locations") or ["Calgary"]
        skills = user_profile.get("skills") or []

        prompt = f"""Generate 6 diverse job search queries for this candidate.
Return ONLY a JSON array of strings, no other text.

Target roles: {positions}
Location: {locations[0] if locations else 'Canada'}
Key skills: {skills[:8]}

Include variations: different titles, seniority levels, related roles.
Example: ["Software Engineer intern Calgary", "Junior Developer co-op Alberta", ...]"""

        response = _invoke_llm(prompt, temperature=0.7)
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        queries = json.loads(cleaned.strip())
        if isinstance(queries, list):
            return queries[:8]
    except Exception as e:
        print(f"Query generation failed: {e}")

    # Fallback
    positions = user_profile.get("positions") or ["software developer"]
    return [f"{p} intern" for p in positions[:3]]


def _deduplicate_jobs(jobs: List[dict]) -> List[dict]:
    """Deduplicate jobs across sources by title + company similarity."""
    seen = {}
    unique = []
    for job in jobs:
        key = f"{(job.get('title') or '').lower().strip()}|{(job.get('company') or '').lower().strip()}"
        if key not in seen:
            seen[key] = True
            unique.append(job)
    return unique


async def fetch_matched_jobs(user_id: ObjectId) -> List[dict]:
    """Fetch jobs from all sources, score with AI, and return ranked matches."""
    users = get_users_col()
    user = users.find_one({"_id": user_id})
    if not user:
        return []

    settings = user.get("auto_apply_settings") or {}
    preferences = user.get("preferences") or {}
    profile = user.get("profile") or {}
    resume_data = (user.get("resume") or {}).get("extracted_data") or {}

    # Build user profile for matching
    user_profile = {
        "positions": settings.get("positions") or preferences.get("positions") or [],
        "locations": settings.get("locations") or preferences.get("locations") or ["Calgary"],
        "work_arrangement": settings.get("work_arrangement") or preferences.get("work_arrangement") or "any",
        "skills": resume_data.get("skills") or [],
        "experience_summary": json.dumps(resume_data.get("experience") or [])[:1000],
        "education": json.dumps(resume_data.get("education") or [])[:500],
    }

    # Generate diverse search queries
    queries = await generate_search_queries(user_profile)
    keywords = user_profile["positions"] or ["software developer"]
    location = user_profile["locations"][0] if user_profile["locations"] else "Calgary"

    # Multi-source search in parallel
    all_jobs = []
    search_tasks = [_search_adzuna(keywords, location)]

    # Also search Adzuna with broader/variant queries from LLM
    for q in queries[:3]:
        search_tasks.append(_search_adzuna([q], location))

    # Add SerpAPI if configured
    if os.getenv("SERPAPI_KEY"):
        for q in queries[:2]:
            search_tasks.append(_search_serpapi(q.split(), location))

    results = await asyncio.gather(*search_tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)
        elif isinstance(result, Exception):
            print(f"Search task error: {result}")

    # Deduplicate
    all_jobs = _deduplicate_jobs(all_jobs)

    # Exclude already-saved and dismissed jobs
    pipeline = get_pipeline_col()
    saved_ids = {doc["job_id"] for doc in pipeline.find({"user_id": user_id}, {"job_id": 1})}
    activity = get_activity_col()
    dismissed_ids = set()
    for doc in activity.find({"user_id": user_id, "action": "dismissed"}, {"details.job_id": 1}):
        jid = (doc.get("details") or {}).get("job_id")
        if jid:
            dismissed_ids.add(jid)

    excluded_companies = [c.lower() for c in (settings.get("excluded_companies") or [])]

    filtered = []
    scam_count = 0
    for job in all_jobs:
        if job["job_id"] in saved_ids or job["job_id"] in dismissed_ids:
            continue
        if (job.get("company") or "").lower() in excluded_companies:
            continue
        # Scam check
        scam = detect_scam_heuristic(job)
        if scam["risk"] == "suspicious":
            job["scam_flags"] = scam["flags"]
            scam_count += 1
            continue
        filtered.append(job)

    # Score with AI (batch — score top 15 to limit API calls)
    threshold = settings.get("match_threshold", 70)
    scored = []
    for i, job in enumerate(filtered[:15]):
        score_data = await score_job_match_ai(user_profile, job)
        total = score_data.get("total_score", 0)
        if total >= threshold:
            job["match_score"] = total
            job["score_breakdown"] = score_data.get("breakdown")
            job["tier"] = score_data.get("tier", 4)
            job["recommendation"] = score_data.get("recommendation", "skip")
            job["flags"] = score_data.get("flags", [])
            job["rationale"] = score_data.get("one_line_rationale", "")
            scored.append(job)

    scored.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return scored


# ──────────────────────────────────────────────
# Pipeline Management
# ──────────────────────────────────────────────

def get_pipeline(user_id: ObjectId) -> dict:
    pipeline = get_pipeline_col()
    items = list(pipeline.find({"user_id": user_id}).sort("updated_at", -1))
    grouped = {"saved": [], "applied": [], "interviewing": [], "offered": [], "rejected": []}
    for item in items:
        item["_id"] = str(item["_id"])
        item["user_id"] = str(item["user_id"])
        status = item.get("status", "saved")
        if status in grouped:
            grouped[status].append(item)
    return grouped


def save_to_pipeline(user_id: ObjectId, job_data: dict) -> dict:
    pipeline = get_pipeline_col()
    job_id = job_data.get("job_id")
    existing = pipeline.find_one({"user_id": user_id, "job_id": job_id})
    if existing:
        existing["_id"] = str(existing["_id"])
        existing["user_id"] = str(existing["user_id"])
        return existing

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": user_id,
        "job_id": job_id,
        "job_data": job_data,
        "status": "saved",
        "cover_letter": None,
        "match_score": job_data.get("match_score", 0),
        "score_breakdown": job_data.get("score_breakdown"),
        "tier": job_data.get("tier"),
        "recommendation": job_data.get("recommendation"),
        "flags": job_data.get("flags", []),
        "rationale": job_data.get("rationale", ""),
        "created_at": now,
        "updated_at": now,
    }
    result = pipeline.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["user_id"] = str(doc["user_id"])

    log_activity(user_id, "saved", {
        "job_id": job_id,
        "title": job_data.get("title"),
        "company": job_data.get("company"),
        "match_score": job_data.get("match_score"),
    })
    return doc


def update_pipeline_status(user_id: ObjectId, job_id: str, status: str) -> Optional[dict]:
    valid_statuses = {"saved", "applied", "interviewing", "offered", "rejected"}
    if status not in valid_statuses:
        return None
    pipeline = get_pipeline_col()
    now = datetime.now(timezone.utc).isoformat()
    result = pipeline.find_one_and_update(
        {"user_id": user_id, "job_id": job_id},
        {"$set": {"status": status, "updated_at": now}},
        return_document=True,
    )
    if result:
        result["_id"] = str(result["_id"])
        result["user_id"] = str(result["user_id"])
        log_activity(user_id, f"status_changed_to_{status}", {
            "job_id": job_id,
            "title": (result.get("job_data") or {}).get("title"),
            "company": (result.get("job_data") or {}).get("company"),
        })
    return result


def remove_from_pipeline(user_id: ObjectId, job_id: str) -> bool:
    pipeline = get_pipeline_col()
    result = pipeline.delete_one({"user_id": user_id, "job_id": job_id})
    return result.deleted_count > 0


# ──────────────────────────────────────────────
# Apply
# ──────────────────────────────────────────────

async def apply_to_job(user_id: ObjectId, job_id: str) -> dict:
    """
    Prepare an application for a job in the pipeline.

    This generates a cover letter (if needed), then calls the new application
    orchestrator to extract fields, map profile data, and generate answers.
    The application ends in 'pending_user_review' status — the user must
    explicitly approve before the worker submits.
    """
    pipeline = get_pipeline_col()
    item = pipeline.find_one({"user_id": user_id, "job_id": job_id})
    if not item:
        raise ValueError("Job not found in pipeline. Save it first.")

    settings = get_settings(user_id)
    now = datetime.now(timezone.utc).isoformat()
    update_fields = {"status": "applied", "applied_at": now, "updated_at": now}

    if settings.get("auto_generate_cover_letter", True) and not item.get("cover_letter"):
        try:
            cover_letter = await generate_cover_letter(user_id, job_id)
            update_fields["cover_letter"] = cover_letter
        except Exception as e:
            print(f"Cover letter generation failed: {e}")

    pipeline.update_one({"user_id": user_id, "job_id": job_id}, {"$set": update_fields})

    log_activity(user_id, "applied", {
        "job_id": job_id,
        "title": (item.get("job_data") or {}).get("title"),
        "company": (item.get("job_data") or {}).get("company"),
    })

    # Trigger the new application orchestrator (extraction + mapping + answers)
    try:
        from application_orchestrator import prepare_application
        app_id = prepare_application(
            user_id=str(user_id),
            job_id=job_id,
        )
        if app_id:
            log_activity(user_id, "application_prepared", {
                "job_id": job_id,
                "application_id": app_id,
            })
    except Exception as e:
        print(f"Application orchestrator failed (non-blocking): {e}")

    updated = pipeline.find_one({"user_id": user_id, "job_id": job_id})
    if updated:
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
    return updated


# ──────────────────────────────────────────────
# Enhanced Cover Letter Generation
# ──────────────────────────────────────────────

async def generate_cover_letter(user_id: ObjectId, job_id: str) -> str:
    """Generate a deeply tailored cover letter using Gemini."""
    pipeline = get_pipeline_col()
    item = pipeline.find_one({"user_id": user_id, "job_id": job_id})
    if not item:
        raise ValueError("Job not found in pipeline")

    users = get_users_col()
    user = users.find_one({"_id": user_id})
    if not user:
        raise ValueError("User not found")

    job_data = item.get("job_data") or {}
    profile = user.get("profile") or {}
    resume_data = (user.get("resume") or {}).get("extracted_data") or {}

    user_name = profile.get("display_name") or \
        f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or "Applicant"

    job_description = job_data.get("description") or ""
    job_title = job_data.get("title") or "the position"
    company = job_data.get("company") or "the company"
    location = job_data.get("location") or ""

    try:
        prompt = f"""You are an expert career strategist writing a cover letter for {user_name}.

RULES:
- 250-400 words
- NEVER start with "I'm excited to apply" or any variant
- Lead with a specific hook tied to the company or role
- Map 2-3 achievements to the job requirements using Situation -> Action -> Result (quantified where possible)
- Every claim must come from the candidate's real experience below — NEVER fabricate
- Show you understand the PROBLEM the role exists to solve
- End with a confident, specific call to action
- Address to "Dear {company} Hiring Team" unless a specific name is known
- Do NOT include [brackets] or placeholder text
- Return ONLY the cover letter text, no additional commentary

SELF-CHECK before outputting:
1. Does it sound natural and personal?
2. Does it address the top 3 requirements from the JD?
3. Is every claim backed by real experience?
4. Would you keep reading after the first sentence?
5. Would this letter work for a different company? If yes, make it more specific.

JOB:
Title: {job_title}
Company: {company}
Location: {location}
Description: {job_description[:4000]}

CANDIDATE:
Name: {user_name}
Experience: {json.dumps(resume_data.get('experience') or [], indent=1)[:2000]}
Education: {json.dumps(resume_data.get('education') or [], indent=1)[:800]}
Skills: {json.dumps(resume_data.get('skills') or [])[:500]}
Projects: {json.dumps(resume_data.get('projects') or [], indent=1)[:1000]}"""

        cover_letter = _invoke_llm(prompt, temperature=0.7)

        # Quality self-evaluation
        try:
            eval_prompt = f"""Rate this cover letter 1-10 on each criterion. Return ONLY JSON:
{{"hook": <1-10>, "tailoring": <1-10>, "evidence": <1-10>, "conciseness": <1-10>, "average": <1-10>, "feedback": "<1 sentence if avg < 8>"}}

Cover letter:
{cover_letter[:2000]}

Job description:
{job_description[:1000]}"""

            eval_text = _invoke_llm(eval_prompt, temperature=0.1)
            cleaned = eval_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            evaluation = json.loads(cleaned.strip())

            # If quality is low, regenerate once
            if evaluation.get("average", 8) < 7:
                feedback = evaluation.get("feedback", "")
                retry_prompt = f"""{prompt}

FEEDBACK FROM QUALITY CHECK (address these issues):
{feedback}

Write a BETTER version."""
                cover_letter = _invoke_llm(retry_prompt, temperature=0.7)
        except Exception:
            pass  # Quality check is best-effort

    except Exception as e:
        print(f"AI cover letter failed: {e}")
        cover_letter = f"""Dear {company} Hiring Team,

I am writing to express my interest in the {job_title} position at {company}. With my background and skills, I believe I would be a strong fit for this role.

I look forward to the opportunity to discuss how my experience aligns with your team's needs.

Sincerely,
{user_name}"""

    # Save to pipeline
    now = datetime.now(timezone.utc).isoformat()
    pipeline.update_one(
        {"user_id": user_id, "job_id": job_id},
        {"$set": {"cover_letter": cover_letter, "updated_at": now}},
    )

    log_activity(user_id, "cover_letter_generated", {
        "job_id": job_id,
        "title": job_data.get("title"),
        "company": job_data.get("company"),
    })
    return cover_letter


# ──────────────────────────────────────────────
# Activity & Analytics
# ──────────────────────────────────────────────

def log_activity(user_id: ObjectId, action: str, details: dict = None):
    try:
        activity = get_activity_col()
        activity.insert_one({
            "user_id": user_id,
            "action": action,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        print(f"Failed to log activity: {e}")


def get_activity(user_id: ObjectId, limit: int = 50) -> List[dict]:
    activity = get_activity_col()
    items = list(activity.find({"user_id": user_id}).sort("timestamp", -1).limit(limit))
    for item in items:
        item["_id"] = str(item["_id"])
        item["user_id"] = str(item["user_id"])
    return items


def get_analytics(user_id: ObjectId) -> dict:
    pipeline = get_pipeline_col()
    items = list(pipeline.find({"user_id": user_id}))

    by_status = {}
    total_score = 0
    score_count = 0
    for item in items:
        s = item.get("status", "saved")
        by_status[s] = by_status.get(s, 0) + 1
        ms = item.get("match_score", 0)
        if ms > 0:
            total_score += ms
            score_count += 1

    applied = by_status.get("applied", 0)
    interviewing = by_status.get("interviewing", 0)
    offered = by_status.get("offered", 0)
    rejected = by_status.get("rejected", 0)
    responded = interviewing + offered + rejected
    response_rate = round((responded / applied * 100) if applied > 0 else 0)
    avg_score = round(total_score / score_count) if score_count > 0 else 0

    # Count cover letters generated
    cl_count = pipeline.count_documents({"user_id": user_id, "cover_letter": {"$ne": None}})

    # Activity stats
    activity = get_activity_col()
    total_actions = activity.count_documents({"user_id": user_id})

    return {
        "total_in_pipeline": len(items),
        "total_applied": applied,
        "total_interviewing": interviewing,
        "total_offered": offered,
        "total_rejected": rejected,
        "total_saved": by_status.get("saved", 0),
        "response_rate": response_rate,
        "avg_match_score": avg_score,
        "cover_letters_generated": cl_count,
        "total_actions": total_actions,
    }


# ──────────────────────────────────────────────
# Agent Orchestrator (State Machine)
# ──────────────────────────────────────────────

AGENT_STATES = ["idle", "searching", "scoring", "generating", "applying", "browser_applying", "paused", "error"]


def get_agent_status(user_id: ObjectId) -> dict:
    """Get the current agent state for a user."""
    col = get_agent_state_col()
    state = col.find_one({"user_id": user_id})
    if not state:
        return {
            "status": "idle",
            "enabled": False,
            "last_action": None,
            "last_action_time": None,
            "current_task": None,
            "daily_count": 0,
            "errors": [],
        }
    state["_id"] = str(state["_id"])
    state["user_id"] = str(state["user_id"])
    return state


def update_agent_status(user_id: ObjectId, status: str, task: str = None, error: str = None):
    """Update agent state in MongoDB."""
    col = get_agent_state_col()
    now = datetime.now(timezone.utc).isoformat()

    update = {
        "status": status,
        "last_action_time": now,
    }
    if task:
        update["current_task"] = task
        update["last_action"] = task
    if status == "idle":
        update["current_task"] = None

    set_op = {"$set": update}
    if error:
        set_op["$push"] = {"errors": {"message": error, "time": now}}

    col.update_one(
        {"user_id": user_id},
        {**set_op, "$setOnInsert": {"user_id": user_id, "enabled": False, "daily_count": 0, "errors": []}},
        upsert=True,
    )


def start_agent(user_id: ObjectId) -> dict:
    """Enable the agent for a user."""
    col = get_agent_state_col()
    now = datetime.now(timezone.utc).isoformat()
    col.update_one(
        {"user_id": user_id},
        {
            "$set": {"enabled": True, "status": "idle", "last_action_time": now, "current_task": None},
            "$setOnInsert": {"user_id": user_id, "daily_count": 0, "errors": []},
        },
        upsert=True,
    )
    # Also update settings
    update_settings(user_id, {"agent_enabled": True})
    log_activity(user_id, "agent_started", {})
    return get_agent_status(user_id)


def pause_agent(user_id: ObjectId) -> dict:
    """Pause the agent."""
    col = get_agent_state_col()
    col.update_one(
        {"user_id": user_id},
        {"$set": {"enabled": False, "status": "paused", "current_task": None}},
    )
    update_settings(user_id, {"agent_enabled": False})
    log_activity(user_id, "agent_paused", {})
    return get_agent_status(user_id)


async def run_agent_cycle(user_id: ObjectId) -> dict:
    """
    Run one full agent cycle: search -> score -> (optionally apply).
    This is the core orchestration loop.
    """
    settings = get_settings(user_id)

    state_col = get_agent_state_col()
    state = state_col.find_one({"user_id": user_id})

    daily_count = (state or {}).get("daily_count", 0)
    daily_limit = settings.get("daily_apply_limit", 10)
    if daily_count >= daily_limit:
        update_agent_status(user_id, "idle", "Daily limit reached")
        return {"status": "limit_reached", "message": f"Daily limit of {daily_limit} reached"}

    results = {"searched": 0, "scored": 0, "applied": 0, "errors": []}

    try:
        # Phase 1: Search
        update_agent_status(user_id, "searching", "Discovering new job matches...")
        matches = await fetch_matched_jobs(user_id)
        results["searched"] = len(matches)

        if not matches:
            update_agent_status(user_id, "idle", "Search complete - no new matches")
            return results

        # Phase 2: Auto-save top matches
        update_agent_status(user_id, "scoring", f"Found {len(matches)} matches, processing...")
        for job in matches[:10]:
            save_to_pipeline(user_id, job)
            results["scored"] += 1

        # Phase 3: Auto-apply if enabled
        if settings.get("auto_apply_enabled"):
            pipeline = get_pipeline_col()
            saved_items = list(pipeline.find({
                "user_id": user_id,
                "status": "saved",
                "match_score": {"$gte": settings.get("match_threshold", 70)},
            }).sort("match_score", -1).limit(daily_limit - daily_count))

            for item in saved_items:
                if daily_count >= daily_limit:
                    break

                # Skip flagged items
                if item.get("flags"):
                    continue

                try:
                    update_agent_status(user_id, "applying",
                        f"Applying to {(item.get('job_data') or {}).get('title', 'job')}...")
                    await apply_to_job(user_id, item["job_id"])
                    results["applied"] += 1
                    daily_count += 1

                    # Update daily count
                    state_col.update_one(
                        {"user_id": user_id},
                        {"$set": {"daily_count": daily_count}},
                    )
                except Exception as e:
                    error_msg = f"Failed to apply to {item.get('job_id')}: {str(e)}"
                    results["errors"].append(error_msg)
                    update_agent_status(user_id, "error", error=error_msg)

        update_agent_status(user_id, "idle",
            f"Cycle complete: {results['searched']} found, {results['scored']} saved, {results['applied']} applied")

        log_activity(user_id, "agent_cycle_complete", results)

    except Exception as e:
        error_msg = f"Agent cycle failed: {str(e)}"
        results["errors"].append(error_msg)
        update_agent_status(user_id, "error", error=error_msg)
        traceback.print_exc()

    return results
