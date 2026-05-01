"""
Question answerer — generates grounded answers to free-text application questions
using the candidate's profile and tailored documents. Includes a semantic cache
for reusable answers.
"""
import json
from typing import Optional

import numpy as np

from models_application import GeneratedAnswer


# ── Reusable answer cache ─────────────────────────────────────────

def _cosine_similarity(a, b) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _check_answer_cache(
    question_text: str,
    profile: dict,
    threshold: float = 0.92,
) -> Optional[dict]:
    """
    Check the user's application_answers_cache for a semantically similar
    question. Returns the cached entry if cosine similarity > threshold.
    """
    cache = profile.get("application_answers_cache") or []
    if not cache:
        return None

    try:
        from ai_service.semantic_matcher import SemanticMatcher
        matcher = SemanticMatcher()
        q_embedding = matcher.model.encode(question_text).tolist()
    except Exception:
        return None

    best_match = None
    best_score = 0.0
    for entry in cache:
        cached_embedding = entry.get("embedding")
        if not cached_embedding:
            continue
        score = _cosine_similarity(q_embedding, cached_embedding)
        if score > best_score:
            best_score = score
            best_match = entry

    if best_match and best_score >= threshold:
        return {**best_match, "cache_score": best_score}
    return None


def _write_answer_to_cache(
    user_id: str,
    question_text: str,
    final_answer: str,
    is_reusable: bool,
) -> None:
    """Write a user-approved answer to the profile cache for future reuse."""
    if not is_reusable:
        return

    try:
        from ai_service.semantic_matcher import SemanticMatcher
        matcher = SemanticMatcher()
        embedding = matcher.model.encode(question_text).tolist()
    except Exception:
        return

    from database import col as users_col
    if users_col is None:
        return

    from bson import ObjectId

    cache_entry = {
        "question_text": question_text,
        "answer": final_answer,
        "embedding": embedding,
        "is_reusable": True,
    }

    try:
        uid = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        users_col.update_one(
            {"_id": uid},
            {"$push": {"application_answers_cache": cache_entry}},
        )
    except Exception as e:
        print(f"Failed to write answer cache: {e}")


# ── Prompt template ───────────────────────────────────────────────

_ANSWER_PROMPT = """You are drafting an answer to a job application question on behalf of a candidate.
RULES:
1. Use ONLY information present in the candidate's profile or tailored documents below. Never invent experiences, projects, opinions, hobbies, or personal details.
2. Match the tone of a thoughtful, concise candidate. No filler ("I am thrilled to..."). No corporate buzzwords.
3. If the profile lacks information needed to answer well, return JSON: {{"needs_user_input": true, "reason": "<one sentence>"}}
4. Otherwise return JSON: {{"answer": "<text>", "source_evidence": ["<bullet or fact from profile that supports>", ...], "is_reusable": <bool>}}
5. is_reusable=true ONLY for generic questions (Why this company / Why this role / Tell us about yourself / Biggest challenge / Strengths / Weaknesses). Role-specific scenario questions are not reusable.
6. Stay under {max_chars} characters.
{hint_section}

QUESTION: {question}
JOB: {job_title} at {company}
JOB DESCRIPTION: {job_description}
CANDIDATE PROFILE: {profile_text}
TAILORED RESUME BULLETS: {resume_bullets}
TAILORED COVER LETTER: {cover_letter}"""


def _build_profile_text(profile: dict) -> str:
    """Render user profile as text for the LLM prompt."""
    p = profile.get("profile", {}) if isinstance(profile.get("profile"), dict) else {}
    resume = (profile.get("resume") or {}).get("extracted_data") or {}

    parts = []
    name = p.get("display_name") or f"{p.get('first_name', '')} {p.get('last_name', '')}".strip()
    if name:
        parts.append(f"Name: {name}")
    if p.get("location"):
        parts.append(f"Location: {p['location']}")

    skills = resume.get("skills") or []
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    experience = resume.get("experience") or []
    if experience:
        exp_lines = []
        for exp in experience[:5]:
            if isinstance(exp, dict):
                title = exp.get("title") or exp.get("position", "")
                company = exp.get("company", "")
                desc = exp.get("description", "")
                bullets = exp.get("bullets") or []
                line = f"- {title} at {company}"
                if desc:
                    line += f": {desc[:200]}"
                if bullets:
                    line += "\n  " + "\n  ".join(f"* {b}" for b in bullets[:4])
                exp_lines.append(line)
        if exp_lines:
            parts.append("Experience:\n" + "\n".join(exp_lines))

    education = resume.get("education") or []
    if education:
        edu_lines = []
        for edu in education[:3]:
            if isinstance(edu, dict):
                school = edu.get("school") or edu.get("institution", "")
                degree = edu.get("degree", "")
                field = edu.get("field") or edu.get("major", "")
                edu_lines.append(f"- {degree} in {field} from {school}".strip(" -"))
        if edu_lines:
            parts.append("Education:\n" + "\n".join(edu_lines))

    projects = resume.get("projects") or []
    if projects:
        proj_lines = []
        for proj in projects[:3]:
            if isinstance(proj, dict):
                name_p = proj.get("name", "")
                desc_p = proj.get("description", "")
                proj_lines.append(f"- {name_p}: {desc_p[:150]}")
        if proj_lines:
            parts.append("Projects:\n" + "\n".join(proj_lines))

    return "\n".join(parts) if parts else "No profile information available."


def answer_question(
    question_text: str,
    user_id: str,
    job_id: str,
    max_chars: int = 1500,
    hint: Optional[str] = None,
) -> GeneratedAnswer:
    """
    Generate a grounded answer to an application question.

    Checks the reusable answer cache first. On miss, calls Gemini with the
    full profile + tailored docs as context.
    """
    from database import col as users_col
    from bson import ObjectId

    # Load user profile
    uid = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
    profile = users_col.find_one({"_id": uid}) if users_col else None
    if not profile:
        return GeneratedAnswer(
            question_id=f"q_{hash(question_text) % 100000}",
            question_text=question_text,
            needs_user_input=True,
            reason="User profile not found",
        )

    # ── Cache check ────────────────────────────────────────────
    cached = _check_answer_cache(question_text, profile)
    if cached:
        return GeneratedAnswer(
            question_id=f"q_{hash(question_text) % 100000}",
            question_text=question_text,
            generated_answer=cached["answer"],
            source_evidence=["(cached from previous application)"],
            confidence=cached.get("cache_score", 0.95),
            is_reusable=True,
            needs_user_input=False,
        )

    # ── Load job data ──────────────────────────────────────────
    from auto_apply_service import get_pipeline_col
    pipeline_col = get_pipeline_col()
    job_doc = pipeline_col.find_one({"user_id": uid, "job_id": job_id})
    job_data = (job_doc or {}).get("job_data", {})

    job_title = job_data.get("title", "the position")
    company = job_data.get("company", "the company")
    job_description = (job_data.get("description") or "")[:3000]

    # Build context strings
    profile_text = _build_profile_text(profile)
    cover_letter = (job_doc or {}).get("cover_letter", "Not available")
    resume_data = (profile.get("resume") or {}).get("extracted_data") or {}
    resume_bullets_list = []
    for exp in (resume_data.get("experience") or [])[:5]:
        if isinstance(exp, dict):
            for b in (exp.get("bullets") or []):
                resume_bullets_list.append(b)
    resume_bullets = "\n".join(f"- {b}" for b in resume_bullets_list[:15]) or "Not available"

    hint_section = f"USER HINT (focus the answer on this): {hint}" if hint else ""

    prompt = _ANSWER_PROMPT.format(
        max_chars=max_chars,
        hint_section=hint_section,
        question=question_text,
        job_title=job_title,
        company=company,
        job_description=job_description,
        profile_text=profile_text,
        resume_bullets=resume_bullets,
        cover_letter=(cover_letter or "Not available")[:2000],
    )

    # ── Call Gemini ─────────────────────────────────────────────
    try:
        from auto_apply_service import _invoke_llm
        raw = _invoke_llm(prompt, temperature=0.5)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned.strip())
    except Exception as e:
        print(f"Question answerer LLM call failed: {e}")
        return GeneratedAnswer(
            question_id=f"q_{hash(question_text) % 100000}",
            question_text=question_text,
            needs_user_input=True,
            reason=f"LLM call failed: {str(e)[:100]}",
        )

    # ── Parse response ─────────────────────────────────────────
    if result.get("needs_user_input"):
        return GeneratedAnswer(
            question_id=f"q_{hash(question_text) % 100000}",
            question_text=question_text,
            needs_user_input=True,
            reason=result.get("reason", "Insufficient profile data"),
        )

    answer_text = result.get("answer", "")
    source_evidence = result.get("source_evidence", [])
    is_reusable = bool(result.get("is_reusable", False))

    # Truncate if over limit
    if len(answer_text) > max_chars:
        answer_text = answer_text[:max_chars - 3] + "..."

    return GeneratedAnswer(
        question_id=f"q_{hash(question_text) % 100000}",
        question_text=question_text,
        generated_answer=answer_text,
        source_evidence=source_evidence if isinstance(source_evidence, list) else [],
        confidence=0.85,
        is_reusable=is_reusable,
        needs_user_input=False,
    )
