"""
Data models for AI Mock Interviewer
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class DifficultyLevel(str, Enum):
    """Interview difficulty levels"""
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"


class InterviewType(str, Enum):
    """Types of interview questions"""
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SITUATIONAL = "situational"
    MIXED = "mixed"


class QuestionType(str, Enum):
    """Individual question types"""
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SITUATIONAL = "situational"
    RESUME_SPECIFIC = "resume_specific"


class InterviewStatus(str, Enum):
    """Interview session status"""
    INITIALIZED = "initialized"
    GENERATING_QUESTIONS = "generating_questions"
    GENERATING_VIDEOS = "generating_videos"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class ResumeInput(BaseModel):
    """Input resume data"""
    raw_text: str
    parsed_data: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "raw_text": "John Doe\\nSoftware Engineer...",
                "parsed_data": {
                    "name": "John Doe",
                    "experience": []
                }
            }
        }


class JobDescriptionInput(BaseModel):
    """Input job description"""
    raw_text: str
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    extracted_requirements: Optional[List[str]] = None


class InterviewConfig(BaseModel):
    """Configuration for interview generation"""
    difficulty: DifficultyLevel = DifficultyLevel.MID
    interview_type: InterviewType = InterviewType.MIXED
    num_questions: int = Field(default=8, ge=3, le=15)
    avatar_id: str = "amy"
    voice_id: str = "en-US-JennyNeural"
    include_resume_specific: bool = True
    enable_video_cache: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "difficulty": "mid",
                "interview_type": "mixed",
                "num_questions": 8,
                "avatar_id": "amy",
                "voice_id": "en-US-JennyNeural"
            }
        }


class InterviewQuestion(BaseModel):
    """Individual interview question"""
    question_id: str
    question_text: str
    question_type: QuestionType
    difficulty_level: int = Field(ge=1, le=5)
    expected_topics: List[str] = []
    context: Optional[str] = None
    evaluation_rubric: Dict[str, Any] = {}
    video_url: Optional[str] = None
    video_duration: Optional[float] = None
    did_video_id: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class STARComponent(BaseModel):
    """STAR method component analysis"""
    situation: bool = False
    task: bool = False
    action: bool = False
    result: bool = False
    score: float = Field(ge=0, le=1)


class AnswerFeedback(BaseModel):
    """Feedback for a user's answer"""
    score: float = Field(ge=0, le=10)
    strengths: List[str] = []
    improvements: List[str] = []
    star_analysis: Optional[STARComponent] = None
    keyword_coverage: float = Field(ge=0, le=1)
    missing_keywords: List[str] = []
    suggested_improvements: str = ""
    detailed_analysis: Optional[str] = None


class InterviewAnswer(BaseModel):
    """User's answer to a question"""
    question_id: str
    answer_text: str
    answer_audio_url: Optional[str] = None
    time_taken_seconds: int
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    feedback: Optional[AnswerFeedback] = None


class InterviewResults(BaseModel):
    """Complete interview results"""
    overall_score: float = Field(ge=0, le=100)
    questions_answered: int
    questions_skipped: int
    breakdown: Dict[str, float] = {}
    strongest_question_id: Optional[str] = None
    weakest_question_id: Optional[str] = None
    improvement_areas: List[str] = []
    readiness_assessment: str = ""
    duration_minutes: int = 0


class InterviewSession(BaseModel):
    """Complete interview session"""
    session_id: str
    resume_input: ResumeInput
    job_description: JobDescriptionInput
    config: InterviewConfig
    status: InterviewStatus
    questions: List[InterviewQuestion] = []
    answers: List[InterviewAnswer] = []
    results: Optional[InterviewResults] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = {}


class CachedVideo(BaseModel):
    """Cached video entry"""
    cache_key: str
    question_text: str
    avatar_id: str
    voice_id: str
    video_url: str
    video_duration: float
    did_video_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    access_count: int = 0
    expires_at: datetime
