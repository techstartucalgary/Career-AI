from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"


class InterviewStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    WRAPPING_UP = "wrapping_up"
    COMPLETED = "completed"


class InterviewConfig(BaseModel):
    job_description: str
    resume: str
    additional_topics: str = ""
    max_questions: int = 10


class Message(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class InterviewSession(BaseModel):
    config: InterviewConfig
    messages: list[Message] = []
    status: InterviewStatus = InterviewStatus.NOT_STARTED
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    question_count: int = 0

    def add_message(self, role: MessageRole, content: str):
        self.messages.append(Message(role=role, content=content))

    def get_transcript(self) -> str:
        lines = []
        for msg in self.messages:
            label = "Interviewer" if msg.role == MessageRole.INTERVIEWER else "Candidate"
            lines.append(f"{label}: {msg.content}")
        return "\n\n".join(lines)
