"""
LinkedIn routes - Profile scraping and AI-powered improvement advice
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from pathlib import Path
import os
import json
import requests
import re

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
SCRAPINGDOG_API_KEY = os.getenv("SCRAPINGDOG_API_KEY")

router = APIRouter(prefix="/api/linkedin", tags=["LinkedIn"])


class LinkedInAnalyzeRequest(BaseModel):
    linkedin_url: str


def extract_linkedin_id(linkedin_url: str) -> str:
    """Extract the profile ID/slug from a LinkedIn URL or return as-is if already a slug."""
    # Handle full URLs like https://www.linkedin.com/in/saqib-mazhar or https://linkedin.com/in/saqib-mazhar/
    match = re.search(r"linkedin\.com/in/([^/?#]+)", linkedin_url)
    if match:
        return match.group(1).strip("/")
    # Assume it's already a slug like "saqib-mazhar"
    if re.match(r"^[a-zA-Z0-9\-]+$", linkedin_url.strip()):
        return linkedin_url.strip()
    raise ValueError(f"Could not parse LinkedIn profile ID from: {linkedin_url}")


def scrape_linkedin_profile(profile_id: str) -> dict:
    """Fetch LinkedIn profile data via ScrapingDog API."""
    if not SCRAPINGDOG_API_KEY:
        raise HTTPException(status_code=501, detail="SCRAPINGDOG_API_KEY not configured.")

    params = {
        "api_key": SCRAPINGDOG_API_KEY,
        "id": profile_id,
        "type": "profile",
        "premium": "true",
        "webhook": "false",
        "fresh": "false",
    }

    response = requests.get("https://api.scrapingdog.com/profile", params=params, timeout=30)

    if response.status_code == 202:
        raise HTTPException(
            status_code=202,
            detail="ScrapingDog is processing the profile. Try again in 2-3 minutes."
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ScrapingDog API error: {response.status_code} - {response.text[:200]}"
        )

    data = response.json()
    if isinstance(data, list):
        if not data:
            raise HTTPException(status_code=502, detail="ScrapingDog returned empty profile data.")
        data = data[0]
    return data


def build_gemini_prompt(profile: dict) -> str:
    """Build a structured prompt for Gemini from the scraped profile data."""
    name = profile.get("name") or profile.get("fullName") or "Unknown"
    headline = profile.get("headline") or ""
    summary = profile.get("summary") or profile.get("about") or ""
    location = profile.get("location") or ""
    connections = profile.get("connectionsCount") or profile.get("connections") or "unknown"
    followers = profile.get("followers") or ""

    # Experience — note missing fields explicitly
    experience = profile.get("experience") or []
    experience_text = ""
    for exp in experience[:5]:
        title = exp.get("title") or exp.get("position") or exp.get("jobTitle") or "[NO TITLE]"
        company = exp.get("company") or exp.get("companyName") or exp.get("company_name") or "[NO COMPANY]"
        duration = exp.get("duration") or exp.get("dateRange") or exp.get("starts_at") or "[NO DATE]"
        desc = exp.get("description") or exp.get("summary") or ""
        experience_text += f"  - Title: {title} | Company: {company} | Duration: {duration}"
        if desc:
            experience_text += f" | Description: {desc[:200]}"
        else:
            experience_text += " | Description: [MISSING]"
        experience_text += "\n"

    # Education
    education = profile.get("education") or []
    education_text = ""
    for edu in education[:3]:
        school = edu.get("school") or edu.get("schoolName") or edu.get("college_name") or ""
        degree = edu.get("degree") or "[NO DEGREE LISTED]"
        field = edu.get("fieldOfStudy") or ""
        starts = edu.get("starts_at") or ""
        ends = edu.get("ends_at") or ""
        years = edu.get("dateRange") or edu.get("duration") or f"{starts}-{ends}".strip("-")
        education_text += f"  - {degree} {field} at {school} ({years})\n"

    # Skills
    skills = profile.get("skills") or []
    if skills and isinstance(skills[0], dict):
        skill_names = [s.get("name") or s.get("skill") or "" for s in skills[:20]]
    else:
        skill_names = [str(s) for s in skills[:20]]
    skills_text = ", ".join(filter(None, skill_names)) or "(none listed)"

    # Certifications
    certs = profile.get("certifications") or profile.get("licenseAndCertifications") or profile.get("certification") or []
    certs_text = ""
    for cert in certs[:5]:
        cert_name = cert.get("name") or cert.get("title") or ""
        cert_org = cert.get("issuingOrganization") or cert.get("authority") or cert.get("organization") or ""
        certs_text += f"  - {cert_name} ({cert_org})\n"

    # Awards
    awards = profile.get("awards") or []
    awards_text = ""
    for award in awards[:5]:
        aname = award.get("name") or ""
        aorg = award.get("organization") or ""
        adate = award.get("duration") or ""
        awards_text += f"  - {aname} from {aorg} ({adate})\n"

    # Projects
    projects = profile.get("projects") or []
    projects_text = ""
    for proj in projects[:5]:
        ptitle = proj.get("title") or ""
        if ptitle:
            projects_text += f"  - {ptitle}\n"

    # Volunteering
    volunteering = profile.get("volunteering") or []
    volunteering_text = ""
    for vol in volunteering[:3]:
        vtitle = vol.get("title") or vol.get("role") or ""
        vorg = vol.get("organization") or vol.get("company") or ""
        if vtitle or vorg:
            volunteering_text += f"  - {vtitle} at {vorg}\n"

    prompt = f"""You are a professional LinkedIn profile coach. Analyze the profile below and give specific, direct feedback based ONLY on what is actually present or missing in this person's profile data. Do not give generic advice — reference their actual companies, roles, schools, and content by name.

=== LINKEDIN PROFILE ===
Name: {name}
Headline: {headline or "[EMPTY — no headline set]"}
Location: {location}
Connections: {connections}
Followers: {followers}

About/Summary:
{summary or "[EMPTY — no about section]"}

Experience ({len(experience)} entries):
{experience_text or "(none)"}

Education:
{education_text or "(none)"}

Skills: {skills_text}

Certifications:
{certs_text or "(none)"}

Awards:
{awards_text or "(none)"}

Projects:
{projects_text or "(none listed on LinkedIn)"}

Volunteering:
{volunteering_text or "(none)"}

=== YOUR TASK ===
Write a profile review using ONLY bullet points — no long paragraphs. Be blunt and specific. Reference their actual data (company names, school, existing content) in your feedback.

Structure your response exactly as follows:

## Overall Score: X/10
- [1-2 bullet points justifying the score based on what's actually there]

## Headline
- Current: [quote their actual headline or note it's empty]
- [bullet points critiquing it]
- Suggested: "[write them a specific improved headline]"

## About / Summary
- [bullet points on what's good or bad about the current about section]
- Suggested rewrite: "[write a short improved version or note what to add]"

## Experience
- [for each company listed, give a specific bullet calling out what's missing — e.g. "Your role at Nimble Science has no title, no dates, and no description — add all three"]
- [suggest what kind of bullet points they should write for each role]

## Skills
- [bullet points on what's missing given their background]
- [specific skills to add based on their experience/education]

## Education & Awards
- [specific feedback on their education entry — is degree listed? GPA? relevant coursework?]
- [note any awards they have and whether they're showcased well]

## Profile Completeness
- [bullet list of specific missing sections or weak areas]

## Top 3 Action Items
1. [most impactful fix]
2. [second most impactful fix]
3. [third most impactful fix]"""

    return prompt


def call_gemini(prompt: str) -> str:
    """Call Gemini API and return the response text."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="GEMINI_API_KEY not configured.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 4096,
        },
    }

    response = requests.post(url, json=payload, timeout=120)

    if response.status_code != 200:
        error_msg = response.json().get("error", {}).get("message", "Unknown error")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {error_msg}")

    result = response.json()
    try:
        return result["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Failed to parse Gemini response.")


@router.post("/analyze")
async def analyze_linkedin_profile(
    body: LinkedInAnalyzeRequest,
    authorization: str = Header(None),
):
    """
    Analyze a LinkedIn profile and return AI-powered improvement advice.

    Requires Bearer token authentication.
    Body: { "linkedin_url": "https://www.linkedin.com/in/your-profile" }
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Bearer token.")

    # Validate token (import here to avoid circular imports)
    from dependencies import get_current_user
    token = authorization.split(" ", 1)[1]
    try:
        get_current_user(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Parse profile ID from URL
    try:
        profile_id = extract_linkedin_id(body.linkedin_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    print(f"LinkedIn analyze request for profile: {profile_id}")

    # Scrape the profile
    profile_data = scrape_linkedin_profile(profile_id)
    print(f"Profile scraped successfully: {profile_data.get('name') or profile_data.get('fullName') or profile_id}")

    # Build prompt and call Gemini
    prompt = build_gemini_prompt(profile_data)
    advice = call_gemini(prompt)

    print(f"Gemini advice generated ({len(advice)} chars)")

    return {
        "success": True,
        "profile_id": profile_id,
        "profile_name": profile_data.get("name") or profile_data.get("fullName") or profile_id,
        "profile_photo": profile_data.get("profile_photo") or "",
        "advice": advice,
    }
