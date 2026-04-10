"""
LLM-based qualification scoring using Gemini.

Evaluates how well a candidate is qualified for a job based on their
skills, experience, and education — not just keyword overlap.
The LLM understands synonyms and equivalences (React = ReactJS, AWS Lambda = serverless, etc.)
"""
import json
import re

from .config import GEMINI_API_KEY, GEMINI_MODEL
from .llm import get_llm_provider

_PROMPT = """\
You are a senior technical recruiter evaluating a candidate's fit for a role.

Analyse the resume and job description below. Return ONLY a valid JSON object — \
no prose, no markdown fences, no extra keys:

{{
  "required_skills_score": <integer 0-100>,
  "preferred_skills_score": <integer 0-100>,
  "experience_score": <integer 0-100>,
  "education_score": <integer 0-100>,
  "overall_qualification_score": <integer 0-100>
}}

Scoring rules
-------------
required_skills_score
  Percentage of the job's required / must-have skills the candidate clearly \
demonstrates. Consider synonyms and equivalent technologies (React = ReactJS, \
AWS = Amazon Web Services, Postgres = PostgreSQL, ML = machine learning, etc.)

preferred_skills_score
  Percentage of preferred / nice-to-have skills the candidate has.
  Default to 50 if no preferred skills are listed.

experience_score
  How well the candidate's work history matches the role's domain, seniority \
level, industry context, and day-to-day responsibilities.
  Consider years of relevant experience, similar job titles, analogous domains.

education_score
  100 = exceeds stated requirements
  75  = meets requirements
  50  = close enough (relevant bootcamp / self-taught with strong portfolio)
  25  = below requirements but has transferable background
  0   = far below or no information
  Default to 75 if the job description states no education requirement.

overall_qualification_score
  Holistic weighted score using:
    required_skills  35 %
    experience       30 %
    preferred_skills 15 %
    education        10 %
    general fit      10 %  (same industry, career trajectory, cultural signals)

Calibration: 70+ = genuinely strong fit.  50-69 = decent with some gaps.
  Below 50 = significant gaps.  Be objective — do not inflate scores.

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}
"""


class QualificationScorer:
    """
    Gemini-backed scorer that evaluates how qualified a candidate is for a job.
    Lazy-initialises the LLM so the object is cheap to construct.
    """

    def __init__(self):
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            self._llm = get_llm_provider(
                provider="gemini",
                api_key=GEMINI_API_KEY,
                model_name=GEMINI_MODEL,
                temperature=0.1,
            )
        return self._llm

    def score(self, resume_text: str, job_description: str) -> float:
        """
        Return overall qualification score 0–100.
        Returns 0.0 on any error so the caller always gets a number.
        """
        try:
            prompt = _PROMPT.format(
                job_description=job_description[:5000],
                resume_text=resume_text[:5000],
            )
            content = self._get_llm().generate_content(prompt)
            if not isinstance(content, str):
                content = getattr(content, 'content', str(content))

            # Strip markdown code fences that some models add
            content = re.sub(r'```[a-zA-Z]*\n?', '', content).strip()

            data = json.loads(content)
            raw = float(data.get("overall_qualification_score", 0))
            return round(max(0.0, min(100.0, raw)), 1)
        except Exception as exc:
            print(f"Qualification scoring error: {exc}")
            return 0.0
