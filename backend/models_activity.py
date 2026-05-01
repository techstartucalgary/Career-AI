"""
Activity event models for the live event stream.
"""
from enum import Enum
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class ActivityEventType(str, Enum):
    agent_started = "agent_started"
    agent_stopped = "agent_stopped"
    jobs_discovered = "jobs_discovered"
    job_matched = "job_matched"
    tailoring_started = "tailoring_started"
    tailoring_completed = "tailoring_completed"
    extraction_started = "extraction_started"
    extraction_completed = "extraction_completed"
    awaiting_review = "awaiting_review"
    review_approved = "review_approved"
    submission_started = "submission_started"
    field_filled = "field_filled"
    file_uploading = "file_uploading"
    file_uploaded = "file_uploaded"
    submission_clicked = "submission_clicked"
    confirmation_received = "confirmation_received"
    screenshot_captured = "screenshot_captured"
    submission_completed = "submission_completed"
    submission_failed = "submission_failed"
    captcha_detected = "captcha_detected"
    login_required = "login_required"
    submission_ready = "submission_ready"


class ActivityEvent(BaseModel):
    event_type: ActivityEventType
    application_id: Optional[str] = None
    title: str = ""
    description: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "info"  # info, warning, error
