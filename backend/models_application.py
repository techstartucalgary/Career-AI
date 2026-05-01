"""
Pydantic models for the auto-apply application lifecycle.
"""
from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Literal

from pydantic import BaseModel, Field


class ApplicationStatus(str, Enum):
    pending_extraction = "pending_extraction"
    pending_user_review = "pending_user_review"
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    blocked_captcha = "blocked_captcha"
    blocked_login_required = "blocked_login_required"
    unsupported_board = "unsupported_board"
    cancelled = "cancelled"
    showcase_completed = "showcase_completed"


class GeneratedAnswer(BaseModel):
    question_id: str
    question_text: str
    generated_answer: str = ""
    source_evidence: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    is_reusable: bool = False
    needs_user_input: bool = False
    reason: Optional[str] = None


class UserApprovedAnswer(BaseModel):
    question_id: str
    final_answer: str
    was_edited: bool = False


class FormField(BaseModel):
    selector: Optional[str] = None
    board_field_id: Optional[str] = None
    field_type: Literal[
        "text", "textarea", "select", "multi_select",
        "file", "checkbox", "radio", "date", "unknown",
    ] = "unknown"
    label: str = ""
    required: bool = False
    options: Optional[List[str]] = None
    max_length: Optional[int] = None
    detected_meaning: Optional[str] = None
    board_specific_meta: Dict[str, Any] = Field(default_factory=dict)


class FillResult(BaseModel):
    filled: Dict[str, str] = Field(default_factory=dict)
    skipped: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class SubmitResult(BaseModel):
    success: bool = False
    confirmation_url: Optional[str] = None
    confirmation_text: Optional[str] = None
    screenshot_path: Optional[str] = None
    error: Optional[str] = None
    error_class: Optional[str] = None


class ScreenshotRecord(BaseModel):
    label: str
    b64_data: str
    taken_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ApplicationDoc(BaseModel):
    """Full document model matching the applications collection schema."""
    # Identity
    user_id: str
    job_id: str
    tailoring_id: Optional[str] = None
    board: Optional[str] = None
    application_url: Optional[str] = None

    # Status
    status: ApplicationStatus = ApplicationStatus.pending_extraction
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    queued_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

    # Form data
    extracted_fields: List[FormField] = Field(default_factory=list)
    generated_answers: List[GeneratedAnswer] = Field(default_factory=list)
    user_approved_answers: List[UserApprovedAnswer] = Field(default_factory=list)
    auto_filled_values: Dict[str, Any] = Field(default_factory=dict)
    share_demographics: bool = False

    # Results
    fill_log: List[str] = Field(default_factory=list)
    screenshots: List[ScreenshotRecord] = Field(default_factory=list)
    confirmation_url: Optional[str] = None
    confirmation_text: Optional[str] = None

    # Errors
    error_reason: Optional[str] = None
    error_class: Optional[str] = None
    retry_count: int = 0

    # Worker
    worker_id: Optional[str] = None
