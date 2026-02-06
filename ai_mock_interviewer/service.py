"""
Main service wrapper for AI Mock Interviewer
"""

import asyncio
from typing import Optional, Dict, Any
from .config import get_config, SystemConfig
from .interview_generator import InterviewGenerator
from .video_service import DIDVideoService
from .evaluation_service import AnswerEvaluationService
from .state_manager import InterviewStateManager
from .cache_manager import CacheManager
from .storage.sqlite_storage import SQLiteStorage
from .models import (
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    InterviewAnswer,
    AnswerFeedback,
    InterviewResults,
    InterviewSession,
    InterviewStatus
)
from .utils.logger import setup_logging, get_logger
from .utils.validators import validate_resume_input, validate_job_description

logger = get_logger(__name__)


class MockInterviewer:
    """
    Main service class for AI Mock Interviewer
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        did_api_key: Optional[str] = None,
        config: Optional[SystemConfig] = None
    ):
        """
        Initialize Mock Interviewer service

        Args:
            gemini_api_key: Google Gemini API key (overrides config)
            did_api_key: D-ID API key (overrides config)
            config: System configuration (uses default if not provided)
        """
        self.config = config or get_config()

        # Override API keys if provided
        if gemini_api_key:
            self.config.gemini.api_key = gemini_api_key
        if did_api_key:
            self.config.did.api_key = did_api_key

        # Setup logging
        setup_logging(self.config.log_level, self.config.log_file)

        # Initialize storage and state manager
        self.storage = SQLiteStorage(self.config.storage.sqlite_path)
        self.state_manager = InterviewStateManager(self.storage)
        self.cache_manager = CacheManager(self.storage, self.config.cache)

        # Initialize AI services
        self.question_generator = InterviewGenerator(
            self.config.gemini.api_key,
            self.config.gemini.model_name
        )

        self.video_service = DIDVideoService(
            self.config.did.api_key,
            self.cache_manager,
            self.config.did.default_avatar,
            self.config.did.default_voice,
            self.config.did.max_retries,
            self.config.did.timeout
        )

        self.evaluation_service = AnswerEvaluationService(
            self.config.gemini.api_key,
            self.config.gemini.model_name
        )

        logger.info("Mock Interviewer service initialized")

    async def create_interview(
        self,
        resume: ResumeInput,
        job_description: JobDescriptionInput,
        config: InterviewConfig
    ) -> str:
        """
        Create a new mock interview

        Args:
            resume: Resume input
            job_description: Job description
            config: Interview configuration

        Returns:
            session_id

        Raises:
            ValueError: If validation fails
        """
        # Validate inputs
        valid, error = validate_resume_input(resume.raw_text)
        if not valid:
            raise ValueError(f"Invalid resume: {error}")

        valid, error = validate_job_description(job_description.raw_text)
        if not valid:
            raise ValueError(f"Invalid job description: {error}")

        # Create session
        session = self.state_manager.create_session(resume, job_description, config)

        try:
            # Generate questions
            logger.info("Generating interview questions")
            self.state_manager.update_session_status(
                session.session_id,
                InterviewStatus.GENERATING_QUESTIONS
            )

            questions = self.question_generator.generate_questions(
                resume, job_description, config
            )

            self.state_manager.add_questions(session.session_id, questions)
            logger.info(f"Generated {len(questions)} questions")

            # Generate videos
            logger.info("Generating videos")
            questions_with_videos = await self.video_service.generate_videos_batch(
                questions,
                config.avatar_id,
                config.voice_id,
                self.config.did.max_concurrent
            )

            # Update session with video URLs
            for question in questions_with_videos:
                if question.video_url:
                    self.state_manager.update_question_video(
                        session.session_id,
                        question.question_id,
                        question.video_url,
                        question.video_duration or 0
                    )

            logger.info(f"Interview created: {session.session_id}")
            return session.session_id

        except Exception as e:
            logger.error(f"Failed to create interview: {e}")
            self.state_manager.update_session_status(
                session.session_id,
                InterviewStatus.FAILED,
                str(e)
            )
            raise

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get interview session by ID"""
        return self.state_manager.get_session(session_id)

    def evaluate_answer(
        self,
        session_id: str,
        question_id: str,
        answer_text: str,
        time_taken_seconds: int = 0
    ) -> AnswerFeedback:
        """
        Evaluate a user's answer

        Args:
            session_id: Interview session ID
            question_id: Question ID
            answer_text: User's answer text
            time_taken_seconds: Time taken to answer

        Returns:
            AnswerFeedback

        Raises:
            ValueError: If session/question not found
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Find question
        question = None
        for q in session.questions:
            if q.question_id == question_id:
                question = q
                break

        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Create answer object
        answer = InterviewAnswer(
            question_id=question_id,
            answer_text=answer_text,
            time_taken_seconds=time_taken_seconds
        )

        # Evaluate
        feedback = self.evaluation_service.evaluate_answer(
            question,
            answer,
            session.job_description.raw_text,
            session.resume_input.raw_text
        )

        answer.feedback = feedback

        # Save answer to session
        self.state_manager.add_answer(session_id, answer)

        return feedback

    def get_results(self, session_id: str) -> Optional[InterviewResults]:
        """
        Calculate and return final interview results

        Args:
            session_id: Interview session ID

        Returns:
            InterviewResults or None if not completed
        """
        session = self.get_session(session_id)
        if not session or not session.answers:
            return None

        # Calculate overall score
        total_score = sum(a.feedback.score for a in session.answers if a.feedback)
        avg_score = (total_score / len(session.answers)) * 10  # Convert to 0-100

        # Find strongest/weakest
        scored_answers = [(a, a.feedback.score) for a in session.answers if a.feedback]
        if not scored_answers:
            return None

        strongest = max(scored_answers, key=lambda x: x[1])
        weakest = min(scored_answers, key=lambda x: x[1])

        # Calculate breakdown by type
        breakdown = {}
        for answer in session.answers:
            if answer.feedback:
                # Find question type
                for q in session.questions:
                    if q.question_id == answer.question_id:
                        q_type = q.question_type.value
                        if q_type not in breakdown:
                            breakdown[q_type] = []
                        breakdown[q_type].append(answer.feedback.score * 10)
                        break

        # Average by type
        for q_type in breakdown:
            breakdown[q_type] = sum(breakdown[q_type]) / len(breakdown[q_type])

        # Create results
        results = InterviewResults(
            overall_score=avg_score,
            questions_answered=len(session.answers),
            questions_skipped=len(session.questions) - len(session.answers),
            breakdown=breakdown,
            strongest_question_id=strongest[0].question_id,
            weakest_question_id=weakest[0].question_id,
            improvement_areas=[],
            readiness_assessment=self._assess_readiness(avg_score)
        )

        # Finalize in state manager
        self.state_manager.finalize_results(session_id, results)

        return results

    def _assess_readiness(self, score: float) -> str:
        """Assess interview readiness based on score"""
        if score >= 85:
            return "Highly Prepared - Ready to interview"
        elif score >= 70:
            return "Well Prepared - Minor improvements needed"
        elif score >= 55:
            return "Moderately Prepared - Practice recommended"
        else:
            return "Needs Improvement - More practice needed"

    def list_interviews(self, limit: int = 50) -> list[InterviewSession]:
        """List all interview sessions"""
        return self.state_manager.list_sessions(limit)
