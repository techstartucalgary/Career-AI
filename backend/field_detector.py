"""
Field meaning detector — classifies form field labels into a closed taxonomy
using an LLM with MongoDB caching.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Tuple, Optional

from database import field_meanings_col


# ── Closed taxonomy ───────────────────────────────────────────────

FIELD_MEANINGS = [
    "first_name", "last_name", "full_name", "preferred_name",
    "email", "phone",
    "location_city", "location_state", "location_country",
    "current_company", "current_title",
    "linkedin_url", "github_url", "portfolio_url", "other_url",
    "resume_upload", "cover_letter_upload", "transcript_upload",
    "work_auth_us", "work_auth_canada", "work_auth_uk", "work_auth_eu",
    "requires_sponsorship",
    "willing_to_relocate", "remote_preference",
    "start_date", "notice_period",
    "salary_expectation", "years_experience",
    "highest_education", "school_name", "degree", "field_of_study",
    "gpa", "graduation_date",
    "gender", "ethnicity", "veteran_status", "disability_status",
    "hispanic_latino",
    "why_company", "why_role", "tell_us_about_yourself",
    "biggest_challenge", "strengths", "weaknesses",
    "additional_info", "how_did_you_hear", "referral_name",
    "agree_to_terms",
    "unknown",
]

FIELD_MEANINGS_SET = set(FIELD_MEANINGS)


def _label_hash(label: str, board: str) -> str:
    """Deterministic hash of (label, board) for cache lookup."""
    raw = f"{label.strip().lower()}||{board.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


# ── Few-shot examples for the classification prompt ───────────────

_FEW_SHOT = [
    {"label": "First Name", "board": "greenhouse", "meaning": "first_name", "confidence": 0.99},
    {"label": "Email Address", "board": "lever", "meaning": "email", "confidence": 0.99},
    {"label": "Upload your resume/CV", "board": "greenhouse", "meaning": "resume_upload", "confidence": 0.98},
    {"label": "Are you legally authorized to work in the United States?", "board": "greenhouse", "meaning": "work_auth_us", "confidence": 0.95},
    {"label": "LinkedIn Profile", "board": "lever", "meaning": "linkedin_url", "confidence": 0.97},
    {"label": "Why do you want to work at our company?", "board": "ashby", "meaning": "why_company", "confidence": 0.93},
    {"label": "Gender", "board": "greenhouse", "meaning": "gender", "confidence": 0.97},
    {"label": "How did you hear about this position?", "board": "lever", "meaning": "how_did_you_hear", "confidence": 0.96},
]


def _build_classification_prompt(label: str, context: dict, board: str) -> str:
    """Build the Gemini classification prompt with few-shot examples."""
    examples_str = "\n".join(
        f'  Input: "{ex["label"]}" (board: {ex["board"]}) -> {{"meaning": "{ex["meaning"]}", "confidence": {ex["confidence"]}}}'
        for ex in _FEW_SHOT
    )

    taxonomy_str = ", ".join(FIELD_MEANINGS)
    context_str = json.dumps(context) if context else "{}"

    return f"""You are a form field classifier for job application forms.
Given a form field label, classify it into EXACTLY ONE of these meanings:
{taxonomy_str}

Rules:
- Return ONLY valid JSON: {{"meaning": "<value>", "confidence": <0.0-1.0>}}
- The meaning MUST be from the taxonomy above. If unsure, use "unknown".
- confidence reflects how certain the classification is (0.0 = random guess, 1.0 = certain).
- Consider the board type for context (different ATS systems use different wording).

Examples:
{examples_str}

Now classify:
  Input: "{label}" (board: {board})
  Context: {context_str}

Return ONLY the JSON object, no other text."""


def detect_meaning(
    label: str,
    context: Optional[dict] = None,
    board: str = "generic",
) -> Tuple[str, float]:
    """
    Detect the semantic meaning of a form field label.

    Returns (meaning, confidence) where meaning is from the closed taxonomy.
    Checks MongoDB cache first; on miss, calls Gemini and caches the result.
    """
    if not label or not label.strip():
        return ("unknown", 0.0)

    context = context or {}
    h = _label_hash(label, board)

    # ── Cache hit ──────────────────────────────────────────────
    if field_meanings_col is not None:
        try:
            cached = field_meanings_col.find_one({"label_hash": h})
            if cached:
                field_meanings_col.update_one(
                    {"_id": cached["_id"]},
                    {
                        "$set": {"last_seen": datetime.now(timezone.utc).isoformat()},
                        "$inc": {"hit_count": 1},
                    },
                )
                return (cached["detected_meaning"], cached.get("confidence", 0.8))
        except Exception as e:
            print(f"Field meanings cache lookup failed: {e}")

    # ── Cache miss — call Gemini ───────────────────────────────
    try:
        from auto_apply_service import _invoke_llm
    except ImportError:
        return ("unknown", 0.0)

    prompt = _build_classification_prompt(label, context, board)

    try:
        raw = _invoke_llm(prompt, temperature=0.1)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned.strip())
    except Exception as e:
        print(f"Field detection LLM call failed for '{label}': {e}")
        return ("unknown", 0.0)

    meaning = result.get("meaning", "unknown")
    confidence = float(result.get("confidence", 0.0))

    # Validate against taxonomy
    if meaning not in FIELD_MEANINGS_SET:
        meaning = "unknown"
        confidence = min(confidence, 0.3)

    # ── Cache result ───────────────────────────────────────────
    if field_meanings_col is not None:
        try:
            now = datetime.now(timezone.utc).isoformat()
            field_meanings_col.update_one(
                {"label_hash": h},
                {
                    "$set": {
                        "label_hash": h,
                        "label_text": label.strip(),
                        "board": board,
                        "detected_meaning": meaning,
                        "confidence": confidence,
                        "last_seen": now,
                    },
                    "$setOnInsert": {"hit_count": 0},
                },
                upsert=True,
            )
        except Exception as e:
            print(f"Field meanings cache write failed: {e}")

    return (meaning, confidence)
