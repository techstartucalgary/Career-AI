"""
Input validation utilities
"""

from typing import Tuple, List


def validate_resume_input(resume_text: str) -> Tuple[bool, str]:
    """
    Validate resume input

    Args:
        resume_text: Resume text to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not resume_text or not resume_text.strip():
        return False, "Resume text cannot be empty"

    if len(resume_text.strip()) < 50:
        return False, "Resume text is too short (minimum 50 characters)"

    if len(resume_text) > 50000:
        return False, "Resume text is too long (maximum 50000 characters)"

    return True, ""


def validate_job_description(job_text: str) -> Tuple[bool, str]:
    """
    Validate job description input

    Args:
        job_text: Job description text to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not job_text or not job_text.strip():
        return False, "Job description cannot be empty"

    if len(job_text.strip()) < 50:
        return False, "Job description is too short (minimum 50 characters)"

    if len(job_text) > 20000:
        return False, "Job description is too long (maximum 20000 characters)"

    return True, ""


def validate_api_keys(gemini_key: str, did_key: str) -> Tuple[bool, List[str]]:
    """
    Validate API keys

    Args:
        gemini_key: Gemini API key
        did_key: D-ID API key

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    if not gemini_key or not gemini_key.strip():
        errors.append("Gemini API key is required")

    if not did_key or not did_key.strip():
        errors.append("D-ID API key is required")

    return len(errors) == 0, errors
