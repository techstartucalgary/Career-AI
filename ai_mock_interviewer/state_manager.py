"""
Interview session state management
"""

import uuid
from typing import Optional, List
from datetime import datetime
from .models import (
    InterviewSession,
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    InterviewQuestion,
    InterviewAnswer,
    InterviewResults,
    InterviewStatus
)
from .storage.sqlite_storage import SQLiteStorage
from .utils.logger import get_logger

logger = get_logger(__name__)


class InterviewStateManager:
    """
    Manages interview session state and persistence
    """

    def __init__(self, storage: SQLiteStorage):
        """
        Initialize state manager

        Args:
            storage: Storage backend (SQLite or JSON)
        """
        self.storage = storage

    def create_session(
        self,
        resume: ResumeInput,
        job_description: JobDescriptionInput,
        config: InterviewConfig
    ) -> InterviewSession:
        """
        Create a new interview session

        Args:
            resume: Resume input
            job_description: Job description
            config: Interview configuration

        Returns:
            Created InterviewSession
        """
        session_id = str(uuid.uuid4())

        session = InterviewSession(
            session_id=session_id,
            resume_input=resume,
            job_description=job_description,
            config=config,
            status=InterviewStatus.INITIALIZED
        )

        self.storage.save_session(session)
        logger.info(f"Created session {session_id}")

        return session

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get session by ID"""
        return self.storage.load_session(session_id)

    def update_session_status(
        self,
        session_id: str,
        status: InterviewStatus,
        error_message: Optional[str] = None
    ):
        """Update session status"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.status = status
        if error_message:
            session.error_message = error_message

        if status == InterviewStatus.IN_PROGRESS and not session.started_at:
            session.started_at = datetime.utcnow()
        elif status == InterviewStatus.COMPLETED:
            session.completed_at = datetime.utcnow()

        self.storage.save_session(session)
        logger.info(f"Updated session {session_id} status to {status.value}")

    def add_questions(
        self,
        session_id: str,
        questions: List[InterviewQuestion]
    ):
        """Add generated questions to session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.questions = questions
        session.status = InterviewStatus.GENERATING_VIDEOS

        self.storage.save_session(session)
        logger.info(f"Added {len(questions)} questions to session {session_id}")

    def update_question_video(
        self,
        session_id: str,
        question_id: str,
        video_url: str,
        video_duration: float
    ):
        """Update question with video URL"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        for question in session.questions:
            if question.question_id == question_id:
                question.video_url = video_url
                question.video_duration = video_duration
                break

        # Check if all videos are ready
        all_ready = all(q.video_url for q in session.questions)
        if all_ready:
            session.status = InterviewStatus.READY

        self.storage.save_session(session)

    def add_answer(
        self,
        session_id: str,
        answer: InterviewAnswer
    ):
        """Add user answer to session"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.answers.append(answer)

        if session.status == InterviewStatus.READY:
            session.status = InterviewStatus.IN_PROGRESS

        self.storage.save_session(session)
        logger.info(f"Added answer for question {answer.question_id}")

    def finalize_results(
        self,
        session_id: str,
        results: InterviewResults
    ):
        """Finalize interview with results"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.results = results
        session.status = InterviewStatus.COMPLETED
        session.completed_at = datetime.utcnow()

        # Calculate duration
        if session.started_at:
            duration = (session.completed_at - session.started_at).total_seconds() / 60
            results.duration_minutes = int(duration)

        self.storage.save_session(session)
        logger.info(f"Finalized session {session_id} with score {results.overall_score}")

    def list_sessions(self, limit: int = 50) -> List[InterviewSession]:
        """List all sessions"""
        return self.storage.list_sessions(limit)
