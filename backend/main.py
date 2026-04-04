"""
Backend file - Refactored for better organization
"""
import os
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI, Query, HTTPException, Header
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
from dependencies import get_current_user
from database import col

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

SCRAPEDOG_JOBS_KEY = os.getenv("SCRAPEDOG_JOBS")
SCRAPEDOG_JOBS_URL = "https://api.scrapingdog.com/jobs"

APIFY_TOKEN = os.getenv("APIFY_TOKEN")
APIFY_DATASET_ID = "T8ZwQlSic6k084UlR"
APIFY_DATASET_URL = f"https://api.apify.com/v2/datasets/{APIFY_DATASET_ID}/items"

# When the client sends no location, use this for LinkedIn/ScrapingDog (Indeed is filtered separately).
DEFAULT_LINKEDIN_JOBS_LOCATION = os.getenv("DEFAULT_LINKEDIN_JOBS_LOCATION", "United States")
# Set DISABLE_LINKEDIN_JOBS=1 when ScrapingDog quota is exhausted (Indeed-only until quota resets).
# Other providers (Bright Data, Oxylabs, Apify LinkedIn actors, etc.) need a separate integration + API key.
DISABLE_LINKEDIN_JOBS = os.getenv("DISABLE_LINKEDIN_JOBS", "").strip().lower() in ("1", "true", "yes", "on")

_US_ABBR_TO_NAME: Dict[str, str] = {
    "al": "alabama", "ak": "alaska", "az": "arizona", "ar": "arkansas", "ca": "california",
    "co": "colorado", "ct": "connecticut", "de": "delaware", "fl": "florida", "ga": "georgia",
    "hi": "hawaii", "id": "idaho", "il": "illinois", "in": "indiana", "ia": "iowa",
    "ks": "kansas", "ky": "kentucky", "la": "louisiana", "me": "maine", "md": "maryland",
    "ma": "massachusetts", "mi": "michigan", "mn": "minnesota", "ms": "mississippi", "mo": "missouri",
    "mt": "montana", "ne": "nebraska", "nv": "nevada", "nh": "new hampshire", "nj": "new jersey",
    "nm": "new mexico", "ny": "new york", "nc": "north carolina", "nd": "north dakota", "oh": "ohio",
    "ok": "oklahoma", "or": "oregon", "pa": "pennsylvania", "ri": "rhode island", "sc": "south carolina",
    "sd": "south dakota", "tn": "tennessee", "tx": "texas", "ut": "utah", "vt": "vermont",
    "va": "virginia", "wa": "washington", "wv": "west virginia", "wi": "wisconsin", "wy": "wyoming",
    "dc": "district of columbia",
}

_CA_ABBR_TO_NAME: Dict[str, str] = {
    "ab": "alberta", "bc": "british columbia", "mb": "manitoba", "nb": "new brunswick",
    "nl": "newfoundland", "ns": "nova scotia", "nt": "northwest territories", "nu": "nunavut",
    "on": "ontario", "pe": "prince edward island", "qc": "quebec", "sk": "saskatchewan", "yt": "yukon",
}


def _geo_synonyms(token: str) -> set[str]:
    t = str(token or "").strip().lower()
    out: set[str] = set()
    if not t:
        return out
    out.add(t)
    if t in _US_ABBR_TO_NAME:
        out.add(_US_ABBR_TO_NAME[t])
    for abbr, name in _US_ABBR_TO_NAME.items():
        if name == t:
            out.add(abbr)
            break
    if t in _CA_ABBR_TO_NAME:
        out.add(_CA_ABBR_TO_NAME[t])
    for abbr, name in _CA_ABBR_TO_NAME.items():
        if name == t:
            out.add(abbr)
            break
    return out


def _resolve_scrape_location(primary: str, fallbacks: List[str]) -> str:
    p = str(primary or "").strip()
    if p:
        return p
    for x in fallbacks:
        if str(x).strip():
            return str(x).strip()
    return DEFAULT_LINKEDIN_JOBS_LOCATION


def _safe_float(value: Any, default: float = 82.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_list(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("jobs", "value", "data"):
            maybe_list = payload.get(key)
            if isinstance(maybe_list, list):
                return maybe_list
    return []


def _clean_text(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    # Normalize common scraper noise (bullets, markdown-ish markers)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\*+", " ", text)
    text = re.sub(r"\\+/", "/", text)
    text = re.sub(r"(?<![:/])\s*/\s*(?![:/])", " ", text)
    text = re.sub(r"[•·▪▸►◆◇■□]+\s*", "\n", text)
    text = re.sub(r"[\t\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n ", "\n", text)
    return text.strip("-:| ").strip()


def _strip_title_noise(title: str) -> str:
    if not title:
        return ""
    t = str(title).strip()
    t = re.sub(
        r"\s*[-–—,:]\s*(?:co-?op|internship).*(?:term|placement|duration).*$",
        "",
        t,
        flags=re.I,
    )
    t = re.sub(
        r"\s*[-–—]\s*(?:term|duration|placement|contract)\s+.*$",
        "",
        t,
        flags=re.I,
    )
    t = re.sub(r"\s*\(\s*\d+\s*[-–]\s*\d+\s*(?:month|week|day)s?\s*(?:term|contract)?\s*\)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*\(\s*\d+\s*(?:month|week|day|year)s?\s*(?:term|contract|internship)?\s*\)\s*$", "", t, flags=re.I)
    t = re.sub(r",\s*\d+\s*(?:month|week)s?\s*(?:term|internship|placement)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s{2,}", " ", t).strip(" -–—:|")
    if len(t) > 90:
        t = " ".join(t.split()[:12])
    return t


def _extract_title_from_description(description: str) -> str:
    if not description:
        return ""

    text = str(description)

    label_match = re.search(
        r"\b(?:job title|title|position)\s*[:\-]\s*(?P<title>.{3,80}?)(?=\s+(?:job id|id|position type|location|overview|responsibilities|must[- ]?have|required|preferred|pay|benefits|how you[’']ll grow|what you will do)|[.;\n]|$)",
        text,
        flags=re.I | re.S,
    )
    if label_match:
        inline_title = _strip_title_noise(_sanitize_job_title(label_match.group("title")))
        if inline_title and len(inline_title.split()) <= 12:
            return inline_title

    role_phrase_match = re.search(
        r"\b((?:(?:lead|senior|principal|staff|junior|associate)\s+)?(?:(?:software|full stack|backend|frontend|data|devops|qa|product)\s+)?(?:engineer|developer|analyst|manager|designer|architect|scientist|specialist|consultant|program manager|product manager))\b",
        text,
        flags=re.I,
    )
    if role_phrase_match:
        role_phrase = _strip_title_noise(_sanitize_job_title(role_phrase_match.group(1)))
        if role_phrase:
            return role_phrase

    blocked_prefixes = (
        "about",
        "pay",
        "benefits",
        "responsibilities",
        "qualifications",
        "work location",
        "job type",
        "location",
        "requirements",
    )

    lines = [
        _clean_text(line)
        for line in text.splitlines()
        if _clean_text(line)
    ]
    for line in lines[:20]:
        lower = line.lower()
        if lower.startswith(blocked_prefixes):
            continue
        if len(line) < 6 or len(line) > 90:
            continue
        if line.endswith(":"):
            continue

        # Prefer lines that look like actual roles.
        if re.search(r"\b(engineer|developer|analyst|manager|intern|co-op|specialist|designer|consultant)\b", lower):
            return _strip_title_noise(line)

    return ""


def _sanitize_job_title(value: Any) -> str:
    text = _clean_text(value)
    if not text:
        return ""

    blocked_prefixes = (
        "about",
        "pay",
        "benefits",
        "responsibilities",
        "qualifications",
        "work location",
        "job type",
        "location",
        "requirements",
        "what you will do",
        "who you are",
        "overview",
    )

    fragments = [text]
    fragments.extend(
        part.strip()
        for part in re.split(r"\s[-–—|:]\s|,\s+", text)
        if part.strip()
    )

    for fragment in fragments:
        lower = fragment.lower()
        if lower.startswith(blocked_prefixes):
            continue
        if len(fragment) < 3:
            continue

        candidate = fragment
        if len(candidate) > 80:
            candidate = re.split(
                r"\b(?:join|build|work|help|support|develop|create|collaborate|design|manage|lead)\b",
                candidate,
                maxsplit=1,
                flags=re.I,
            )[0].strip()

        if len(candidate) > 90:
            continue

        if len(candidate.split()) <= 12:
            return _strip_title_noise(candidate)

    fallback = fragments[0]
    if len(fallback) > 90:
        fallback = " ".join(fallback.split()[:12])
    return _strip_title_noise(fallback)


def _extract_total_from_payload(payload: Any) -> int | None:
    if isinstance(payload, dict):
        for key in (
            "total_count",
            "total",
            "count",
            "jobs_count",
            "jobsCount",
            "total_jobs",
            "num_results",
            "results_count",
        ):
            total = payload.get(key)
            if isinstance(total, bool):
                continue
            if isinstance(total, int):
                return max(0, total)
            if isinstance(total, float):
                return max(0, int(total))
            if isinstance(total, str) and total.strip().isdigit():
                return max(0, int(total.strip()))

    return None


def _parse_job_datetime(value: Any) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    if isinstance(value, (int, float)):
        timestamp = float(value)
        if timestamp > 1_000_000_000_000:
            timestamp /= 1000.0
        try:
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None

    text = _clean_text(value)
    if not text:
        return None

    lowered = text.lower()
    now = datetime.now(timezone.utc)

    relative_match = re.search(r"(?P<count>\d+)\+?\s+(?P<unit>minute|hour|day|week|month|year)s?\s+ago", lowered)
    if relative_match:
        count = int(relative_match.group("count"))
        unit = relative_match.group("unit")
        delta_kwargs = {
            "minute": {"minutes": count},
            "hour": {"hours": count},
            "day": {"days": count},
            "week": {"weeks": count},
            "month": {"days": count * 30},
            "year": {"days": count * 365},
        }.get(unit, {})
        return now - timedelta(**delta_kwargs)

    if any(token in lowered for token in ("just posted", "just now", "today", "recently posted", "posted today")):
        return now
    if "yesterday" in lowered:
        return now - timedelta(days=1)

    normalized = text.replace("Z", "+00:00")
    candidates = [normalized]
    if "T" in normalized:
        candidates.append(normalized.split("T", 1)[0])

    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %Y",
        "%d %B %Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%m/%d/%Y %H:%M",
        "%d-%m-%Y",
    ]

    for candidate in candidates:
        try:
            parsed = datetime.fromisoformat(candidate)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

        for fmt in formats:
            try:
                return datetime.strptime(candidate, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue

    return None


def _extract_job_datetime(job: Dict[str, Any], keys: List[str]) -> datetime | None:
    for key in keys:
        parsed = _parse_job_datetime(job.get(key))
        if parsed:
            return parsed
    return None


def _posted_sort_timestamp(job: Dict[str, Any]) -> float | None:
    dt = _extract_job_datetime(
        job,
        ["posted", "postedAt", "posted_at", "job_posting_date", "job_posting_time", "date"],
    )
    if dt:
        return dt.timestamp()
    return None


def _job_is_recent_enough(job: Dict[str, Any], max_age_days: int = 21) -> bool:
    posted_at = _extract_job_datetime(
        job,
        [
            "posted",
            "postedAt",
            "posted_at",
            "job_posting_date",
            "job_posting_time",
            "date",
            "publication_date",
        ],
    )
    if posted_at is not None:
        age = datetime.now(timezone.utc) - posted_at
        return age <= timedelta(days=max_age_days)

    fallback_text = " ".join(
        str(job.get(key) or "")
        for key in ("posted", "postedAt", "job_posting_date", "job_posting_time", "date")
    ).lower()
    if any(token in fallback_text for token in ("recently posted", "just posted", "today", "yesterday", "hour", "day", "week")):
        if any(token in fallback_text for token in ("month", "year", "older")):
            return False
        return True

    return True


def _job_has_open_deadline(job: Dict[str, Any]) -> bool:
    close_date = _extract_job_datetime(
        job,
        [
            "close_date",
            "closing_date",
            "application_deadline",
            "deadline",
            "expires",
            "expiration_date",
            "expire_at",
            "apply_by",
            "close_at",
        ],
    )
    if close_date is None:
        return True

    return close_date >= datetime.now(timezone.utc)


def _job_matches_job_types(job: Dict[str, Any], selected_job_types: List[str]) -> bool:
    if not selected_job_types:
        return True

    haystack = " ".join(
        str(job.get(key) or "")
        for key in (
            "title",
            "description",
            "employment_type",
            "job_type",
        )
    ).lower()
    types = [str(type_value).strip().lower() for type_value in (job.get("types") or []) if str(type_value).strip()]

    for job_type in selected_job_types:
        job_type_clean = str(job_type or "").strip().lower()
        if not job_type_clean:
            continue
        if job_type_clean in haystack:
            return True
        if any(job_type_clean == type_value or job_type_clean in type_value for type_value in types):
            return True
        if job_type_clean == "internship" and any(token in haystack for token in ("intern", "internship", "co-op", "coop")):
            return True
        if job_type_clean == "full-time" and any(token in haystack for token in ("full time", "full-time", "fte")):
            return True
        if job_type_clean == "part-time" and any(token in haystack for token in ("part time", "part-time", "pt")):
            return True
        if job_type_clean == "contract" and any(token in haystack for token in ("contract", "contractor")):
            return True
        if job_type_clean == "temporary" and any(token in haystack for token in ("temporary", "temp", "seasonal")):
            return True
        if job_type_clean == "remote" and any(token in haystack for token in ("remote", "work from home", "wfh")):
            return True

    return False


def _tokenize(text: str) -> List[str]:
    return [token for token in re.split(r"[^a-z0-9]+", text.lower()) if len(token) > 1]


def _location_term_matches_job(job_loc_lower: str, term: str) -> bool:
    t = str(term or "").strip().lower()
    if not t:
        return False
    if t in job_loc_lower:
        return True
    for syn in _geo_synonyms(t):
        if syn and syn in job_loc_lower:
            return True
    pref_tokens = set(_tokenize(t))
    loc_tokens = set(_tokenize(job_loc_lower))
    if not pref_tokens or not loc_tokens:
        return False
    overlap = len(pref_tokens & loc_tokens)
    return overlap >= max(1, int(0.45 * len(pref_tokens)))


def _role_match_score(job: Dict[str, Any], preferred_positions: List[str]) -> float:
    if not preferred_positions:
        return 100.0

    haystack = " ".join([
        str(job.get("title") or ""),
        str(job.get("description") or ""),
        str(job.get("company") or ""),
    ]).lower()
    hay_tokens = set(_tokenize(haystack))

    best = 0.0
    for pref in preferred_positions:
        pref_clean = str(pref or "").strip().lower()
        if not pref_clean:
            continue
        if pref_clean in haystack:
            best = max(best, 100.0)
            continue

        pref_tokens = set(_tokenize(pref_clean))
        if not pref_tokens:
            continue
        overlap = len(pref_tokens & hay_tokens)
        token_score = (overlap / len(pref_tokens)) * 100.0
        best = max(best, token_score)

    return best


def _location_match_score(job: Dict[str, Any], preferred_locations: List[str]) -> float:
    if not preferred_locations:
        return 100.0

    job_location = str(job.get("location") or "").lower()
    hay = " ".join([
        job_location,
        str(job.get("title") or "").lower(),
        str(job.get("description") or "")[:800].lower(),
    ])
    if not hay.strip():
        return 0.0

    best = 0.0
    for pref in preferred_locations:
        pref_clean = str(pref or "").strip().lower()
        if not pref_clean:
            continue
        if _location_term_matches_job(job_location, pref_clean):
            best = max(best, 100.0)
            continue

        pref_tokens = set(_tokenize(pref_clean))
        loc_tokens = set(_tokenize(job_location))
        if not pref_tokens:
            continue
        overlap = len(pref_tokens & loc_tokens)
        token_score = (overlap / len(pref_tokens)) * 100.0
        best = max(best, token_score)

        for syn in _geo_synonyms(pref_clean):
            if syn and syn in hay:
                best = max(best, 88.0)
                break

    if best < 58.0 and any(
        r in hay for r in ("remote", "work from home", "wfh", "anywhere in", "worldwide", "hybrid")
    ):
        best = max(best, 58.0)

    return best


def _job_type_match_score(job: Dict[str, Any], selected_job_types: List[str]) -> float:
    if not selected_job_types:
        return 100.0
    return 100.0 if _job_matches_job_types(job, selected_job_types) else 28.0


def _annotate_job_fit(
    job: Dict[str, Any],
    preferred_positions: List[str],
    preferred_locations: List[str],
    selected_job_types: List[str],
    fit_mode: str,
) -> Dict[str, Any]:
    role = round(max(0.0, min(100.0, _role_match_score(job, preferred_positions))), 1)
    loc = round(max(0.0, min(100.0, _location_match_score(job, preferred_locations))), 1)
    jt = round(max(0.0, min(100.0, _job_type_match_score(job, selected_job_types))), 1)

    has_pos = bool(preferred_positions)
    has_loc = bool(preferred_locations)
    mode = (fit_mode or "broad").strip().lower()
    if mode not in ("strict", "broad"):
        mode = "broad"

    if has_pos and has_loc:
        if mode == "strict":
            composite = round(min(100.0, 0.38 * role + 0.38 * loc + 0.14 * jt + 0.1 * min(role, loc)), 1)
        else:
            composite = round(min(100.0, 0.52 * max(role, loc) + 0.28 * min(role, loc) + 0.2 * jt), 1)
        # Recommended: strong dual match OR clear primary + acceptable secondary
        strict_gate = (
            (role >= 38.0 and loc >= 38.0)
            or (role >= 58.0 and loc >= 22.0)
            or (role >= 22.0 and loc >= 58.0)
        )
        broad_key = max(role, loc)
    elif has_pos:
        composite = round(min(100.0, 0.82 * role + 0.18 * jt), 1)
        strict_gate = role >= 36.0
        broad_key = role
    elif has_loc:
        composite = round(min(100.0, 0.82 * loc + 0.18 * jt), 1)
        strict_gate = loc >= 36.0
        broad_key = loc
    else:
        desc_n = len(str(job.get("description") or ""))
        title_n = len(str(job.get("title") or ""))
        base = 34.0 + min(38.0, desc_n / 100.0) + min(18.0, title_n / 6.0)
        provider = _safe_float(job.get("match_score"), 50.0)
        composite = round(max(18.0, min(96.0, 0.55 * base + 0.45 * min(provider, 95.0))), 1)
        strict_gate = True
        broad_key = composite

    enriched = {
        **job,
        "role_fit": role,
        "location_fit": loc,
        "type_fit": jt,
        "fit_score": composite,
        "match_score": composite,
    }
    return enriched, strict_gate, broad_key


def _scrapedog_get(params: Dict[str, Any]) -> Any:
    if not SCRAPEDOG_JOBS_KEY:
        raise HTTPException(status_code=500, detail="SCRAPEDOG_JOBS not configured")

    response = requests.get(
        SCRAPEDOG_JOBS_URL,
        params={"api_key": SCRAPEDOG_JOBS_KEY, **params},
        timeout=30,
    )
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Invalid LinkedIn jobs provider response") from exc

    if not response.ok:
        message = payload.get("message") if isinstance(payload, dict) else "unknown error"
        raise HTTPException(status_code=502, detail=f"LinkedIn jobs provider failed: {message}")

    return payload


def _normalize_linkedin_job(item: Dict[str, Any]) -> Dict[str, Any]:
    employment_type = item.get("Employment_type") or item.get("employment_type")
    description = _clean_text(item.get("job_description") or item.get("description") or "")
    title_candidate = item.get("job_position") or item.get("title") or item.get("job_title") or item.get("job_name") or item.get("role") or ""
    cleaned_title = _sanitize_job_title(title_candidate)
    if not cleaned_title or cleaned_title.lower() in {"untitled role", "untitled"}:
        cleaned_title = _extract_title_from_description(description)
    if not cleaned_title:
        cleaned_title = "Untitled role"
    return {
        "id": str(item.get("job_id") or item.get("job_link") or item.get("job_position") or ""),
        "source": "linkedin",
        "title": cleaned_title,
        "company": item.get("company_name") or "Company",
        "location": item.get("job_location") or "Location not listed",
        "posted": item.get("job_posting_time") or item.get("job_posting_date") or "Recently posted",
        "salary": item.get("base_pay") or "Compensation not listed",
        "description": description,
        "types": [employment_type] if employment_type else [],
        "employment_type": employment_type,
        "apply_url": item.get("job_link"),
        "company_logo_url": item.get("company_logo_url"),
        "match_score": _safe_float(item.get("match_score")),
    }


def _normalize_indeed_job(item: Dict[str, Any]) -> Dict[str, Any]:
    raw_job_type = item.get("jobType")
    job_types: List[str] = []

    if isinstance(raw_job_type, list):
        for value in raw_job_type:
            if isinstance(value, list):
                job_types.extend([str(v).strip() for v in value if str(v).strip()])
            elif str(value).strip():
                job_types.append(str(value).strip())
    elif isinstance(raw_job_type, str) and raw_job_type.strip():
        job_types.append(raw_job_type.strip())

    description = _clean_text(item.get("description") or "")
    title_candidate = (
        item.get("title")
        or item.get("jobTitle")
        or item.get("position")
        or item.get("role")
        or ""
    )
    cleaned_title = _sanitize_job_title(title_candidate)
    if not cleaned_title or cleaned_title.lower() in {"untitled role", "untitled"}:
        cleaned_title = _extract_title_from_description(description)
    if not cleaned_title:
        cleaned_title = "Untitled role"

    apply_url = item.get("url") or item.get("jobUrl")
    indeed_id = item.get("id")
    if not indeed_id and isinstance(apply_url, str) and apply_url:
        try:
            parsed = urlparse(apply_url)
            indeed_id = parse_qs(parsed.query).get("jk", [None])[0]
        except Exception:
            indeed_id = None

    if not indeed_id:
        indeed_id = f"{item.get('companyName') or item.get('company') or 'job'}-{cleaned_title}".replace(" ", "-").lower()

    return {
        "id": str(indeed_id),
        "source": "indeed",
        "title": cleaned_title,
        "company": item.get("companyName") or item.get("company") or "Company",
        "location": item.get("location") or "Location not listed",
        "posted": item.get("postedAt") or "Recently posted",
        "salary": item.get("salary") or "Compensation not listed",
        "description": description,
        "types": job_types,
        "employment_type": job_types[0] if job_types else None,
        "apply_url": apply_url,
        "company_logo_url": item.get("companyLogo") or item.get("image"),
        "match_score": _safe_float(item.get("match_score"), 80.0),
    }


def _fetch_linkedin_jobs(
    keywords: List[str],
    location: str,
    page: int,
    limit: int,
    include_details: bool,
    job_types: List[str] | None = None,
) -> tuple[List[Dict[str, Any]], int | None]:
    params: Dict[str, Any] = {
        "location": location,
        "page": page,
        "exp_level": "internship",
    }
    keyword_query = " ".join([keyword.strip() for keyword in keywords if keyword.strip()])
    if keyword_query:
        params["keyword"] = keyword_query

    payload = _scrapedog_get(params)
    list_items = _as_list(payload)
    reported_total = _extract_total_from_payload(payload)
    filtered_items = _filter_jobs(list_items, keywords, location, job_types, None)
    total_count = reported_total if reported_total is not None else len(filtered_items)
    start = (page - 1) * limit
    end = start + limit
    page_items = filtered_items[start:end]

    if not include_details:
        return [_normalize_linkedin_job(item) for item in page_items], total_count

    enriched_items: List[Dict[str, Any]] = []
    for item in page_items:
        job_id = item.get("job_id")
        if not job_id:
            enriched_items.append(item)
            continue

        try:
            detail_payload = _scrapedog_get({"job_id": job_id})
            detail_items = _as_list(detail_payload)
            if detail_items:
                merged = {**item, **detail_items[0]}
                merged["job_link"] = item.get("job_link") or merged.get("job_link")
                merged["job_posting_date"] = item.get("job_posting_date") or merged.get("job_posting_date")
                merged["company_logo_url"] = item.get("company_logo_url") or merged.get("company_logo_url")
                enriched_items.append(merged)
            else:
                enriched_items.append(item)
        except HTTPException:
            enriched_items.append(item)

    return [_normalize_linkedin_job(item) for item in enriched_items], total_count


def _fetch_indeed_jobs() -> List[Dict[str, Any]]:
    if not APIFY_TOKEN:
        return []

    response = requests.get(APIFY_DATASET_URL, params={"token": APIFY_TOKEN}, timeout=30)
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Apify request failed with status code: {response.status_code} - {response.text[:200]}"
        )

    payload = response.json()
    return [_normalize_indeed_job(item) for item in payload if isinstance(item, dict)]


def _apply_filters_and_paginate(
    jobs: List[Dict[str, Any]],
    keywords: List[str],
    location: str,
    page: int,
    limit: int,
    or_location_terms: List[str] | None = None,
) -> List[Dict[str, Any]]:
    filtered = _filter_jobs(jobs, keywords, location, None, or_location_terms)
    start = (page - 1) * limit
    end = start + limit
    return filtered[start:end]


def _filter_jobs(
    jobs: List[Dict[str, Any]],
    keywords: List[str],
    location: str,
    job_types: List[str] | None = None,
    or_location_terms: List[str] | None = None,
) -> List[Dict[str, Any]]:
    selected_job_types = [str(value).strip() for value in (job_types or []) if str(value).strip()]
    keyword_tokens = [token.lower() for token in keywords if token.strip()]

    loc_terms: List[str] = []
    if str(location or "").strip():
        loc_terms.append(str(location).strip())
    elif or_location_terms:
        for x in or_location_terms:
            if str(x).strip():
                loc_terms.append(str(x).strip())

    filtered = jobs

    filtered = [job for job in filtered if _job_is_recent_enough(job) and _job_has_open_deadline(job)]

    if selected_job_types:
        filtered = [job for job in filtered if _job_matches_job_types(job, selected_job_types)]

    if keyword_tokens:
        def has_keywords(job: Dict[str, Any]) -> bool:
            haystack = " ".join([
                str(job.get("title") or ""),
                str(job.get("company") or ""),
                str(job.get("description") or ""),
            ]).lower()
            # OR across terms — matches typical job-board search behavior
            return any(token in haystack for token in keyword_tokens)

        filtered = [job for job in filtered if has_keywords(job)]

    if loc_terms:
        def matches_any_region(job: Dict[str, Any]) -> bool:
            jl = str(job.get("location") or "").lower()
            return any(_location_term_matches_job(jl, term) for term in loc_terms)

        location_filtered = [job for job in filtered if matches_any_region(job)]
        if location_filtered:
            filtered = location_filtered

    return filtered


def _interleave(job_lists: List[List[Dict[str, Any]]], limit: int) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    index = 0
    while len(merged) < limit:
        added = False
        for jobs in job_lists:
            if index < len(jobs):
                merged.append(jobs[index])
                added = True
                if len(merged) >= limit:
                    break
        if not added:
            break
        index += 1
    return merged


def _to_int(value: Any, fallback: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _unique_cap(items: List[str], cap: int = 18) -> List[str]:
    out: List[str] = []
    seen: set[str] = set()
    for raw in items:
        x = str(raw or "").strip()
        if not x:
            continue
        key = x.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(x)
        if len(out) >= cap:
            break
    return out


@app.get("/api/jobs")
async def get_jobs(
    keywords: List[str] = Query(default=[]),
    location: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    sources: List[str] = Query(default=["linkedin", "indeed"]),
    include_details: bool = Query(default=True),
    job_types: List[str] = Query(default=[]),
    preferred_positions: List[str] = Query(default=[]),
    preferred_locations: List[str] = Query(default=[]),
    min_fit_score: float = Query(default=0.0, ge=0.0, le=100.0),
    fit_mode: str = Query(default="broad"),
    sort_by: str = Query(default="match"),
    authorization: str = Header(default=None),
):
    selected_sources = [source.strip().lower() for source in sources if source.strip()]
    if not selected_sources:
        selected_sources = ["linkedin", "indeed"]

    mode_norm = (fit_mode or "broad").strip().lower()
    if mode_norm not in ("strict", "broad"):
        mode_norm = "broad"

    profile_positions: List[str] = []
    profile_locations: List[str] = []
    learned_pos: List[str] = []
    learned_loc: List[str] = []
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            user_id = get_current_user(token)
            user = col.find_one({"_id": user_id})
            job_preferences = user.get("job_preferences") if isinstance(user, dict) else {}
            if isinstance(job_preferences, dict):
                raw_positions = job_preferences.get("positions")
                raw_locations = job_preferences.get("locations")
                if isinstance(raw_positions, list):
                    profile_positions = [str(v).strip() for v in raw_positions if str(v).strip()]
                if isinstance(raw_locations, list):
                    profile_locations = [str(v).strip() for v in raw_locations if str(v).strip()]
                lk = job_preferences.get("learned_keywords")
                ll = job_preferences.get("learned_locations")
                if isinstance(lk, list):
                    learned_pos = [str(v).strip() for v in lk if str(v).strip()][:24]
                if isinstance(ll, list):
                    learned_loc = [str(v).strip() for v in ll if str(v).strip()][:24]
        except Exception:
            profile_positions = []
            profile_locations = []
            learned_pos = []
            learned_loc = []

    req_positions = [str(v).strip() for v in preferred_positions if str(v).strip()]
    req_locations = [str(v).strip() for v in preferred_locations if str(v).strip()]
    base_pos = req_positions if req_positions else profile_positions
    base_loc = req_locations if req_locations else profile_locations
    effective_positions = _unique_cap(base_pos + learned_pos)
    effective_locations = _unique_cap(base_loc + learned_loc)
    effective_job_types = [str(v).strip() for v in job_types if str(v).strip()]

    primary_loc = str(location or "").strip()
    scrape_loc = _resolve_scrape_location(primary_loc, effective_locations)
    indeed_or_locations = effective_locations if not primary_loc else None

    sort_key = (sort_by or "match").strip().lower()
    if sort_key not in ("match", "posted_newest", "posted_oldest"):
        sort_key = "match"

    source_job_lists: List[List[Dict[str, Any]]] = []
    source_errors: Dict[str, str] = {}
    linkedin_meta_total: int | None = None

    if "linkedin" in selected_sources:
        if DISABLE_LINKEDIN_JOBS:
            source_errors["linkedin"] = "LinkedIn jobs disabled (DISABLE_LINKEDIN_JOBS). Using Indeed only."
        elif not SCRAPEDOG_JOBS_KEY:
            source_errors["linkedin"] = "SCRAPEDOG_JOBS not configured."
        else:
            try:
                linkedin_jobs, linkedin_total_count = _fetch_linkedin_jobs(
                    keywords, scrape_loc, page, limit, include_details, effective_job_types
                )
                source_job_lists.append(linkedin_jobs)
                linkedin_meta_total = linkedin_total_count
            except HTTPException as exc:
                source_errors["linkedin"] = str(exc.detail)

    indeed_filtered: List[Dict[str, Any]] = []
    if "indeed" in selected_sources:
        try:
            indeed_jobs = _fetch_indeed_jobs()
            indeed_filtered = _filter_jobs(
                indeed_jobs,
                keywords,
                primary_loc,
                effective_job_types,
                indeed_or_locations,
            )
            source_job_lists.append(indeed_filtered)
        except HTTPException as exc:
            source_errors["indeed"] = str(exc.detail)

    if not source_job_lists and source_errors:
        raise HTTPException(status_code=502, detail=source_errors)

    merge_cap = sum(len(lst) for lst in source_job_lists)
    all_jobs = _interleave(source_job_lists, max(merge_cap, 1))

    deduped: List[Dict[str, Any]] = []
    seen = set()
    for job in all_jobs:
        dedupe_key = f"{job.get('source')}::{job.get('id')}"
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        enriched, strict_gate, broad_key = _annotate_job_fit(
            job, effective_positions, effective_locations, effective_job_types, mode_norm
        )
        enriched["_strict_gate"] = strict_gate
        enriched["_broad_key"] = broad_key
        deduped.append(enriched)

    if mode_norm == "strict" and (effective_positions or effective_locations):
        deduped = [j for j in deduped if j.get("_strict_gate", True)]

    if sort_key == "posted_newest":
        deduped.sort(
            key=lambda job: (
                -(_posted_sort_timestamp(job) or 0.0),
                -_safe_float(job.get("fit_score"), 0.0),
                str(job.get("title") or ""),
            )
        )
    elif sort_key == "posted_oldest":
        deduped.sort(
            key=lambda job: (
                (_posted_sort_timestamp(job) if _posted_sort_timestamp(job) is not None else float("inf")),
                -_safe_float(job.get("fit_score"), 0.0),
                str(job.get("title") or ""),
            )
        )
    else:
        deduped.sort(
            key=lambda job: (
                -_safe_float(job.get("_broad_key"), _safe_float(job.get("fit_score"), 0.0)),
                -_safe_float(job.get("fit_score"), 0.0),
                str(job.get("posted") or ""),
                str(job.get("title") or ""),
            )
        )

    if min_fit_score > 0:
        deduped = [job for job in deduped if _safe_float(job.get("fit_score"), 0.0) >= min_fit_score]

    for job in deduped:
        job.pop("_strict_gate", None)
        job.pop("_broad_key", None)

    filtered_total_count = len(deduped)
    start = (page - 1) * limit
    end = start + limit
    page_jobs = deduped[start:end]

    return {
        "jobs": page_jobs,
        "count": len(page_jobs),
        "total_count": filtered_total_count,
        "page": page,
        "limit": limit,
        "sources": selected_sources,
        "source_errors": source_errors,
        "preferences_applied": bool(effective_positions or effective_locations),
        "preferred_positions": effective_positions,
        "preferred_locations": effective_locations,
        "job_types": effective_job_types,
        "min_fit_score": min_fit_score,
        "fit_mode": mode_norm,
        "sort_by": sort_key,
        "linkedin_reported_total": linkedin_meta_total,
        "indeed_pool_count": len(indeed_filtered),
        "scrape_location_used": scrape_loc,
    }


@app.get("/api/jobs/{job_id}")
async def get_job_by_id(
    job_id: str,
    source: str = Query(default="linkedin"),
):
    normalized_source = (source or "linkedin").strip().lower()

    if normalized_source == "linkedin":
        payload = _scrapedog_get({"job_id": job_id})
        items = _as_list(payload)
        if not items:
            raise HTTPException(status_code=404, detail="Job not found")
        return _normalize_linkedin_job(items[0])

    if normalized_source == "indeed":
        indeed_jobs = _fetch_indeed_jobs()
        match = next((job for job in indeed_jobs if str(job.get("id")) == str(job_id)), None)
        if not match:
            raise HTTPException(status_code=404, detail="Indeed job not found")
        return match

    raise HTTPException(status_code=400, detail="Unsupported source. Use linkedin or indeed.")


@app.get("/api/indeed-jobs")
async def get_indeed_jobs(
    keywords: List[str] = Query(default=[]),
    location: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
):
    indeed_jobs = _fetch_indeed_jobs()
    page_items = _apply_filters_and_paginate(indeed_jobs, keywords, location, page, limit)
    return {
        "success": True,
        "count": len(page_items),
        "jobs": page_items,
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