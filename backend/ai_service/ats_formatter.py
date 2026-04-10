"""
ATS (Applicant Tracking System) compliance scoring.

Evaluates how well a resume will be parsed and ranked by ATS systems.
ATS systems score on: keyword presence, section structure, and parse quality.
No LLM required — this is deterministic and fast.
"""
import re
from typing import Set

# Words that are not meaningful for keyword matching
_STOP_WORDS = {
    'the', 'and', 'for', 'are', 'you', 'that', 'with', 'this', 'have', 'from',
    'will', 'your', 'not', 'but', 'can', 'all', 'been', 'they', 'their', 'our',
    'who', 'has', 'its', 'what', 'we', 'be', 'is', 'in', 'of', 'to', 'a', 'an',
    'as', 'at', 'by', 'on', 'or', 'if', 'it', 'do', 'no', 'up', 'so', 'us',
    'my', 'also', 'into', 'such', 'more', 'well', 'each', 'than', 'when',
    'while', 'how', 'use', 'used', 'using', 'new', 'high', 'work', 'role',
    'team', 'able', 'good', 'great', 'strong', 'must', 'may', 'should', 'need',
    'want', 'help', 'join', 'part', 'year', 'years', 'experience', 'skills',
    'ability', 'requires', 'required', 'preferred', 'looking', 'seeking',
    'working', 'create', 'build', 'develop', 'manage', 'support', 'lead',
    'drive', 'own', 'maintain', 'define', 'implement', 'deliver', 'design',
    'test', 'review', 'write', 'collaborate', 'partner', 'communicate',
    'report', 'learn', 'provide', 'ensure', 'position', 'candidate', 'company',
    'opportunity', 'environment', 'culture', 'mission', 'values', 'business',
    'other', 'some', 'most', 'both', 'those', 'these', 'them', 'then', 'out',
    'just', 'over', 'after', 'first', 'well', 'way', 'even', 'back', 'where',
    'much', 'many', 'any', 'around',
}

# Lightweight stemming — maps inflected forms to a canonical root
_STEM_MAP = {
    'developing': 'develop', 'development': 'develop', 'developed': 'develop',
    'building': 'build', 'built': 'build', 'builds': 'build',
    'designing': 'design', 'designed': 'design', 'designs': 'design',
    'managing': 'manage', 'managed': 'manage', 'management': 'manage',
    'testing': 'test', 'tested': 'test', 'tests': 'test',
    'deploying': 'deploy', 'deployed': 'deploy', 'deployment': 'deploy',
    'optimizing': 'optimize', 'optimized': 'optimize', 'optimization': 'optimize',
    'implementing': 'implement', 'implemented': 'implement',
    'implementation': 'implement',
    'analyzing': 'analyze', 'analyzed': 'analyze', 'analysis': 'analyze',
    'integrating': 'integrate', 'integrated': 'integrate',
    'integration': 'integrate',
    'automating': 'automate', 'automated': 'automate', 'automation': 'automate',
    'architecting': 'architect', 'architected': 'architect',
    'architecture': 'architect',
    'monitoring': 'monitor', 'monitored': 'monitor',
    'maintaining': 'maintain', 'maintained': 'maintain',
    'maintenance': 'maintain',
    'configuring': 'configure', 'configured': 'configure',
    'configuration': 'configure',
    'scaling': 'scale', 'scaled': 'scale',
    'migrating': 'migrate', 'migrated': 'migrate', 'migration': 'migrate',
    'refactoring': 'refactor', 'refactored': 'refactor',
    'debugging': 'debug', 'debugged': 'debug',
    'engineering': 'engineer', 'engineered': 'engineer',
    'processing': 'process', 'processed': 'process', 'processes': 'process',
    'programming': 'program', 'programmed': 'program',
    'collaborating': 'collaborate', 'collaborated': 'collaborate',
    'communicating': 'communicate', 'communicated': 'communicate',
    'leading': 'lead', 'leads': 'lead',
    'supporting': 'support', 'supported': 'support',
}

# Section header patterns for each required section
_REQUIRED_SECTIONS = {
    'experience': [
        r'\b(experience|work\s+history|employment\s+history|work\s+experience|positions?\s+held)\b'
    ],
    'education': [
        r'\b(education|academic\s+background|degree|university|college|schooling)\b'
    ],
    'skills': [
        r'\b(skills?|technical\s+skills?|core\s+competencies|areas?\s+of\s+expertise|proficiencies|technologies)\b'
    ],
}


def _extract_terms(text: str) -> Set[str]:
    """Extract meaningful skill/tool/tech terms from text, with light stemming."""
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#./_-]{1,}\b', text.lower())
    terms: Set[str] = set()
    for w in words:
        if len(w) >= 3 and w not in _STOP_WORDS:
            terms.add(_STEM_MAP.get(w, w))
    return terms


def _score_sections(resume_text: str) -> float:
    """Score 0-1: fraction of required resume sections that are detectable."""
    text_lower = resume_text.lower()
    found = sum(
        1 for patterns in _REQUIRED_SECTIONS.values()
        if any(re.search(p, text_lower) for p in patterns)
    )
    return found / len(_REQUIRED_SECTIONS)


def _score_formatting(resume_text: str) -> float:
    """
    Score 0-1: how cleanly the resume parsed.

    Penalises:
    - Very short lines (< 12 chars) — typical of table cells or multi-column layout
    - Lines with 3+ consecutive spaces — column separators
    - Overall low character count — resume failed to parse (graphics-heavy)
    """
    lines = [l for l in resume_text.split('\n') if l.strip()]
    if not lines:
        return 0.5

    total = len(lines)
    total_chars = sum(len(l.strip()) for l in lines)

    # Resume text is essentially empty — bad parse
    if total_chars < 400:
        return 0.15

    short_lines = sum(1 for l in lines if 0 < len(l.strip()) < 12)
    short_ratio = short_lines / total

    multi_space_lines = sum(1 for l in lines if re.search(r' {3,}', l))
    multi_ratio = multi_space_lines / total

    score = 1.0

    if short_ratio > 0.5:
        score -= 0.35
    elif short_ratio > 0.35:
        score -= 0.20
    elif short_ratio > 0.20:
        score -= 0.10

    if multi_ratio > 0.40:
        score -= 0.25
    elif multi_ratio > 0.20:
        score -= 0.12

    return max(0.1, score)


def _score_placement(resume_text: str, jd_terms: Set[str]) -> float:
    """
    Score 0-1: fraction of JD terms that appear in the first ~30% of the resume.
    Keywords in the summary / early experience get higher ATS weight in real systems.
    """
    if not jd_terms:
        return 0.5
    early = resume_text[: int(len(resume_text) * 0.30)].lower()
    early_terms = _extract_terms(early)
    return len(jd_terms & early_terms) / len(jd_terms)


def score_ats(resume_text: str, job_description: str) -> float:
    """
    Calculate ATS compliance score (0–100).

    Components
    ----------
    40%  Keyword match rate   — JD skill terms present anywhere in resume
    20%  Keyword placement    — Key terms appear early (summary / first role)
    20%  Section completeness — Experience, Education, Skills sections detected
    20%  Formatting quality   — No table/column parse artefacts
    """
    jd_terms = _extract_terms(job_description)
    resume_terms = _extract_terms(resume_text)

    keyword_score = len(jd_terms & resume_terms) / len(jd_terms) if jd_terms else 0.5
    placement = _score_placement(resume_text, jd_terms)
    sections = _score_sections(resume_text)
    formatting = _score_formatting(resume_text)

    overall = (
        keyword_score * 0.40
        + placement   * 0.20
        + sections    * 0.20
        + formatting  * 0.20
    )

    return round(min(overall * 100, 100.0), 1)
