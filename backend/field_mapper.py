"""
Profile-to-field mapper — maps detected field meanings to values from the user
profile, tailored documents, or flags them as needing user input.
"""
import re
from dataclasses import dataclass, field as dc_field
from typing import Any, Dict, List, Literal, Optional

from models_application import FormField

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None  # graceful degradation — exact match only


@dataclass
class MappedValue:
    value: Any = None
    source: Literal["profile", "job", "tailored", "override", "needs_user_input"] = "needs_user_input"
    confidence: float = 0.0
    reason: Optional[str] = None


# ── Fuzzy option matching ─────────────────────────────────────────

def _fuzzy_match_option(value: str, options: List[str], threshold: int = 80, precise: bool = False) -> Optional[str]:
    """Return the best-matching option using rapidfuzz, or None.

    When precise=True, uses fuzz.ratio (position-sensitive) to avoid
    false matches like "I am not a veteran" -> "I am a veteran".
    Default uses token_set_ratio for broader matching.
    """
    if not options or not value:
        return None

    # Always try exact case-insensitive match first
    lower = value.lower()
    for opt in options:
        if opt.lower() == lower:
            return opt

    if fuzz is None:
        return None

    scorer = fuzz.ratio if precise else fuzz.token_set_ratio
    best_score = 0
    best_opt = None
    for opt in options:
        score = scorer(lower, opt.lower())
        if score > best_score:
            best_score = score
            best_opt = opt
    return best_opt if best_score >= threshold else None


def _decline_option(options: List[str]) -> Optional[str]:
    """Find a 'Decline to self-identify' style option from a list."""
    decline_phrases = [
        "decline", "prefer not", "choose not", "do not wish",
        "i don't wish", "rather not", "not disclose", "n/a",
    ]
    for opt in options:
        lower = opt.lower()
        if any(phrase in lower for phrase in decline_phrases):
            return opt

    # Fuzzy fallback
    return _fuzzy_match_option("Decline to self-identify", options, threshold=70)


# ── Phone normalization ────────────────────────────────────────────

def _normalize_phone(val: str) -> str:
    """Strip formatting, keep digits and leading +."""
    if not val:
        return val
    if val.startswith("+"):
        return "+" + re.sub(r"[^\d]", "", val[1:])
    return re.sub(r"[^\d]", "", val)


# ── Country inference from region abbreviation ────────────────────

_CANADIAN_PROVINCES = frozenset([
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
])
_US_STATES = frozenset([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC",
])


def _infer_country_from_region(region: str) -> Optional[str]:
    """Infer country from a 2-letter province/state abbreviation."""
    code = region.strip().upper()
    if code in _CANADIAN_PROVINCES:
        return "Canada"
    if code in _US_STATES:
        return "United States"
    return None


# ── Mapping rules per meaning ─────────────────────────────────────

def _get_profile_value(profile: dict, *keys: str) -> Optional[str]:
    """Walk nested profile dict for a value."""
    for key in keys:
        parts = key.split(".")
        val = profile
        for part in parts:
            if isinstance(val, dict):
                val = val.get(part)
            else:
                val = None
                break
        if val:
            return str(val)
    return None


def map_field(
    field: FormField,
    profile: dict,
    job: dict,
    tailored_docs: dict,
    overrides: Optional[dict] = None,
) -> MappedValue:
    """
    Map a single form field to a value based on its detected_meaning.

    Args:
        field: The FormField with detected_meaning set.
        profile: User profile document from MongoDB.
        job: Job document.
        tailored_docs: Dict with keys 'resume_b64', 'cover_letter_text', etc.
        overrides: Dict with 'share_demographics' (bool) and field-level overrides.

    Returns:
        MappedValue with the value, source, and confidence.
    """
    overrides = overrides or {}
    meaning = field.detected_meaning or "unknown"
    p = profile.get("profile", {}) if isinstance(profile.get("profile"), dict) else {}
    options = field.options or []
    share_demographics = overrides.get("share_demographics", False)

    # ── Name fields ────────────────────────────────────────────
    if meaning == "first_name":
        val = _get_profile_value(profile, "profile.first_name")
        if not val:
            display = _get_profile_value(profile, "profile.display_name")
            if display and display.strip():
                val = display.strip().split()[0]
        if val:
            return MappedValue(val, "profile", 0.99)

    if meaning == "last_name":
        val = _get_profile_value(profile, "profile.last_name")
        if not val:
            display = _get_profile_value(profile, "profile.display_name")
            if display and len(display.strip().split()) > 1:
                val = " ".join(display.strip().split()[1:])
        if val:
            return MappedValue(val, "profile", 0.99)

    if meaning == "full_name":
        first = _get_profile_value(profile, "profile.first_name") or ""
        last = _get_profile_value(profile, "profile.last_name") or ""
        full = f"{first} {last}".strip()
        if not full:
            full = _get_profile_value(profile, "profile.display_name")
        if full:
            return MappedValue(full, "profile", 0.98)

    if meaning == "preferred_name":
        val = _get_profile_value(profile, "profile.display_name", "profile.first_name")
        if val:
            return MappedValue(val, "profile", 0.90)

    # ── Contact ────────────────────────────────────────────────
    if meaning == "email":
        val = profile.get("email")
        if val:
            return MappedValue(val, "profile", 0.99)

    if meaning == "phone":
        val = _get_profile_value(profile, "profile.phone")
        if val:
            return MappedValue(_normalize_phone(val), "profile", 0.97)

    # ── Location ───────────────────────────────────────────────
    if meaning == "location_city":
        loc = _get_profile_value(profile, "profile.location") or ""
        city = loc.split(",")[0].strip() if loc else None
        if city:
            return MappedValue(city, "profile", 0.85)

    if meaning == "location_state":
        loc = _get_profile_value(profile, "profile.location") or ""
        parts = loc.split(",")
        state = parts[1].strip() if len(parts) > 1 else None
        if state:
            return MappedValue(state, "profile", 0.80)

    if meaning == "location_country":
        loc = _get_profile_value(profile, "profile.location") or ""
        parts = loc.split(",")
        country = parts[-1].strip() if len(parts) > 2 else None
        if not country and len(parts) >= 2:
            region = parts[1].strip()
            country = _infer_country_from_region(region)
        if country:
            return MappedValue(country, "profile", 0.75)

    # ── Links ──────────────────────────────────────────────────
    if meaning == "linkedin_url":
        val = _get_profile_value(profile, "profile.linkedin")
        if val:
            # Select fields (e.g. "Do you have a LinkedIn?") need Yes/No, not the URL
            if field.field_type == "select":
                return MappedValue("Yes", "profile", 0.98)
            return MappedValue(val, "profile", 0.98)

    if meaning == "github_url":
        val = _get_profile_value(profile, "profile.github")
        if val:
            if field.field_type == "select":
                return MappedValue("Yes", "profile", 0.98)
            return MappedValue(val, "profile", 0.98)

    if meaning == "portfolio_url":
        val = _get_profile_value(profile, "profile.website")
        if val:
            return MappedValue(val, "profile", 0.95)

    if meaning == "other_url":
        val = _get_profile_value(profile, "profile.website", "profile.github")
        if val:
            return MappedValue(val, "profile", 0.80)

    # ── Employment ─────────────────────────────────────────────
    if meaning == "current_company":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        experience = resume.get("experience") or []
        if experience and isinstance(experience[0], dict):
            val = experience[0].get("company")
            if val:
                return MappedValue(val, "profile", 0.85)

    if meaning == "current_title":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        experience = resume.get("experience") or []
        if experience and isinstance(experience[0], dict):
            val = experience[0].get("title") or experience[0].get("position")
            if val:
                return MappedValue(val, "profile", 0.85)

    # ── File uploads ───────────────────────────────────────────
    if meaning == "resume_upload":
        if tailored_docs.get("resume_b64"):
            return MappedValue(tailored_docs["resume_b64"], "tailored", 0.99)
        resume_data = (profile.get("resume") or {}).get("file_data")
        if resume_data:
            return MappedValue(resume_data, "profile", 0.90)
        return MappedValue(None, "needs_user_input", 0.0, reason="No resume file available")

    if meaning == "cover_letter_upload":
        if tailored_docs.get("cover_letter_text"):
            return MappedValue(tailored_docs["cover_letter_text"], "tailored", 0.95)
        return MappedValue(None, "needs_user_input", 0.0, reason="No cover letter available")

    if meaning == "transcript_upload":
        return MappedValue(None, "needs_user_input", 0.0, reason="Transcript upload required")

    # ── Work authorization ─────────────────────────────────────
    _auth_meanings = {
        "work_auth_us": ["us", "united states", "usa"],
        "work_auth_canada": ["canada", "canadian"],
        "work_auth_uk": ["uk", "united kingdom", "british"],
        "work_auth_eu": ["eu", "european union", "europe"],
    }
    if meaning in _auth_meanings:
        citizenship = (profile.get("citizenship") or "").lower()
        work_auth = (profile.get("work_authorization_status") or "").lower()
        country_keywords = _auth_meanings[meaning]
        authorized = any(kw in citizenship for kw in country_keywords) or \
                     any(kw in work_auth for kw in country_keywords)

        # Infer from location if explicit citizenship/work_auth fields are empty
        inferred = False
        if not authorized and not citizenship and not work_auth:
            loc = (_get_profile_value(profile, "profile.location") or "").lower()
            pref_locs = (profile.get("job_preferences") or {}).get("locations", [])
            all_loc_text = loc + " " + " ".join(l.lower() for l in pref_locs)
            # Also check inferred country from region abbreviation
            loc_parts = (loc or "").split(",")
            if len(loc_parts) >= 2:
                inferred_country = _infer_country_from_region(loc_parts[1].strip())
                if inferred_country:
                    all_loc_text += " " + inferred_country.lower()
            if any(kw in all_loc_text for kw in country_keywords):
                authorized = True
                inferred = True

        if inferred:
            print(f"[mapper] Inferred {meaning}=Yes from location for user "
                  f"(no explicit citizenship/work_authorization_status set)")

        answer = "Yes" if authorized else "No"
        if options:
            matched = _fuzzy_match_option(answer, options)
            if matched:
                return MappedValue(matched, "profile", 0.85 if not inferred else 0.70)
        return MappedValue(answer, "profile", 0.80 if not inferred else 0.65)

    if meaning == "requires_sponsorship":
        work_auth = (profile.get("work_authorization_status") or "").lower()
        citizenship = (profile.get("citizenship") or "").lower()
        no_sponsorship = "citizen" in citizenship or "permanent" in work_auth or "authorized" in work_auth

        # Infer from location if explicit fields are empty
        inferred = False
        if not no_sponsorship and not citizenship and not work_auth:
            loc = (_get_profile_value(profile, "profile.location") or "").lower()
            pref_locs = (profile.get("job_preferences") or {}).get("locations", [])
            all_loc_text = loc + " " + " ".join(l.lower() for l in pref_locs)
            loc_parts = (loc or "").split(",")
            if len(loc_parts) >= 2:
                inferred_country = _infer_country_from_region(loc_parts[1].strip())
                if inferred_country:
                    all_loc_text += " " + inferred_country.lower()
            # If user lives in the country, assume they can work there
            if any(kw in all_loc_text for kw in ["us", "united states", "usa", "canada", "canadian", "uk", "united kingdom"]):
                no_sponsorship = True
                inferred = True

        if inferred:
            print(f"[mapper] Inferred requires_sponsorship=No from location for user "
                  f"(no explicit citizenship/work_authorization_status set)")

        answer = "No" if no_sponsorship else "Yes"
        if options:
            matched = _fuzzy_match_option(answer, options)
            if matched:
                return MappedValue(matched, "profile", 0.80 if not inferred else 0.65)
        return MappedValue(answer, "profile", 0.75 if not inferred else 0.60)

    # ── Preferences ────────────────────────────────────────────
    if meaning == "willing_to_relocate":
        arrangement = (profile.get("job_preferences") or {}).get("work_arrangement", "any")
        answer = "Yes" if arrangement in ("any", "onsite", "hybrid") else "No"
        if options:
            matched = _fuzzy_match_option(answer, options)
            if matched:
                return MappedValue(matched, "profile", 0.70)
        return MappedValue(answer, "profile", 0.65)

    if meaning == "remote_preference":
        arrangement = (profile.get("job_preferences") or {}).get("work_arrangement", "any")
        if options:
            matched = _fuzzy_match_option(arrangement, options)
            if matched:
                return MappedValue(matched, "profile", 0.75)
        return MappedValue(arrangement, "profile", 0.65)

    if meaning == "start_date":
        val = _get_profile_value(profile, "profile.start_date_available")
        if val:
            if options:
                matched = _fuzzy_match_option(val, options)
                if matched:
                    return MappedValue(matched, "profile", 0.70)
            return MappedValue(val, "profile", 0.65)
        return MappedValue(None, "needs_user_input", 0.0, reason="Start date varies per role")

    if meaning == "notice_period":
        val = _get_profile_value(profile, "profile.notice_period")
        if val:
            if options:
                matched = _fuzzy_match_option(val, options)
                if matched:
                    return MappedValue(matched, "profile", 0.70)
            return MappedValue(val, "profile", 0.65)
        return MappedValue(None, "needs_user_input", 0.0, reason="Notice period not in profile")

    if meaning == "salary_expectation":
        val = _get_profile_value(profile, "profile.salary_expectation")
        if val:
            return MappedValue(val, "profile", 0.65)
        return MappedValue(None, "needs_user_input", 0.0, reason="Salary expectation varies per role")

    if meaning == "years_experience":
        val = _get_profile_value(profile, "profile.years_experience")
        if val is not None:
            v = str(val)
            if options:
                matched = _fuzzy_match_option(v, options)
                if matched:
                    return MappedValue(matched, "profile", 0.75)
            return MappedValue(v, "profile", 0.70)
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        experience = resume.get("experience") or []
        if experience:
            return MappedValue(str(len(experience)), "profile", 0.50)
        return MappedValue(None, "needs_user_input", 0.0, reason="Cannot determine years of experience")

    # ── Education ──────────────────────────────────────────────
    if meaning == "highest_education":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            degree = education[0].get("degree", "")
            if options:
                matched = _fuzzy_match_option(degree, options)
                if matched:
                    return MappedValue(matched, "profile", 0.80)
            return MappedValue(degree, "profile", 0.75)
        return MappedValue(None, "needs_user_input", 0.0, reason="Education not in profile")

    if meaning == "school_name":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            val = education[0].get("school") or education[0].get("institution")
            if val:
                return MappedValue(val, "profile", 0.90)

    if meaning == "degree":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            val = education[0].get("degree")
            if val:
                if options:
                    matched = _fuzzy_match_option(val, options)
                    if matched:
                        return MappedValue(matched, "profile", 0.85)
                return MappedValue(val, "profile", 0.80)

    if meaning == "field_of_study":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            val = education[0].get("field") or education[0].get("major")
            if val:
                return MappedValue(val, "profile", 0.85)

    if meaning == "gpa":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            val = education[0].get("gpa")
            if val:
                return MappedValue(str(val), "profile", 0.90)

    if meaning == "graduation_date":
        resume = (profile.get("resume") or {}).get("extracted_data") or {}
        education = resume.get("education") or []
        if education and isinstance(education[0], dict):
            val = education[0].get("graduation_date") or education[0].get("end_date")
            if val:
                return MappedValue(val, "profile", 0.85)

    # ── Demographics — respect share_demographics toggle ───────
    _demo_meanings = ["gender", "ethnicity", "veteran_status", "disability_status", "hispanic_latino"]
    if meaning in _demo_meanings:
        if not share_demographics:
            if options:
                decline = _decline_option(options)
                if decline:
                    return MappedValue(decline, "override", 0.95)
            return MappedValue("Decline to self-identify", "override", 0.90)
        else:
            # Pull from profile demographics
            demo_key_map = {
                "gender": "gender",
                "ethnicity": "ethnicity",
                "veteran_status": "veteran_status",
                "disability_status": "disability_status",
                "hispanic_latino": "hispanic_latino",
            }
            profile_key = demo_key_map.get(meaning, meaning)
            # Check profile.demographics.* first, then root-level fallback
            demographics = (profile.get("profile") or {}).get("demographics") or {}
            val = demographics.get(profile_key) or profile.get(profile_key) or profile.get(meaning)
            if val:
                if options:
                    matched = _fuzzy_match_option(val, options, threshold=75, precise=True)
                    if matched:
                        return MappedValue(matched, "profile", 0.85)
                return MappedValue(val, "profile", 0.80)
            # Have demographics sharing on but no value — decline
            if options:
                decline = _decline_option(options)
                if decline:
                    return MappedValue(decline, "override", 0.80)
            return MappedValue("Decline to self-identify", "override", 0.75)

    # ── Free-text custom questions → needs_user_input ──────────
    _freetext_meanings = [
        "why_company", "why_role", "tell_us_about_yourself",
        "biggest_challenge", "strengths", "weaknesses",
        "additional_info",
    ]
    if meaning in _freetext_meanings:
        return MappedValue(
            None, "needs_user_input", 0.0,
            reason=f"Custom question ({meaning}) requires AI-generated answer",
        )

    # ── Simple fields ──────────────────────────────────────────
    if meaning == "how_did_you_hear":
        if options:
            # Try common answers
            for candidate in ["Job Board", "Online", "Website", "Other"]:
                matched = _fuzzy_match_option(candidate, options)
                if matched:
                    return MappedValue(matched, "override", 0.70)
        return MappedValue(None, "needs_user_input", 0.0, reason="How did you hear not configured")

    if meaning == "referral_name":
        return MappedValue(None, "needs_user_input", 0.0, reason="Referral name not in profile")

    if meaning == "agree_to_terms":
        return MappedValue(True, "override", 0.99)

    # ── Unknown ────────────────────────────────────────────────
    return MappedValue(
        None, "needs_user_input", 0.0,
        reason=f"Unknown field meaning: {meaning}",
    )
