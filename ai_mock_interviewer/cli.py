#!/usr/bin/env python3
"""
CLI interface for AI Mock Interviewer
"""

import asyncio
import argparse
import sys
import webbrowser
from pathlib import Path
from .service import MockInterviewer
from .config import get_config, load_config_from_file
from .models import (
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    DifficultyLevel,
    InterviewType,
    InterviewStatus
)
from .utils.logger import setup_logging, get_logger

logger = get_logger(__name__)


class MockInterviewCLI:
    """Command-line interface for mock interviewer"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize CLI with configuration"""
        if config_path:
            self.config = load_config_from_file(config_path)
        else:
            self.config = get_config()

        setup_logging(self.config.log_level, self.config.log_file)

        # Initialize service
        self.service = MockInterviewer(config=self.config)

    async def create_interview(
        self,
        resume_path: str,
        job_description_path: str,
        difficulty: str = "mid",
        interview_type: str = "mixed",
        num_questions: int = 8
    ) -> str:
        """
        Create a new mock interview

        Returns:
            session_id
        """
        logger.info("Creating new mock interview")

        # Load inputs
        with open(resume_path, 'r') as f:
            resume_text = f.read()

        with open(job_description_path, 'r') as f:
            job_text = f.read()

        resume = ResumeInput(raw_text=resume_text)
        job_desc = JobDescriptionInput(raw_text=job_text)

        config = InterviewConfig(
            difficulty=DifficultyLevel(difficulty),
            interview_type=InterviewType(interview_type),
            num_questions=num_questions
        )

        print("Creating mock interview...")
        print(f"  Resume: {resume_path}")
        print(f"  Job: {job_description_path}")
        print(f"  Difficulty: {difficulty}")
        print(f"  Type: {interview_type}")
        print(f"  Questions: {num_questions}\n")

        try:
            print("Generating personalized questions...")
            session_id = await self.service.create_interview(resume, job_desc, config)

            session = self.service.get_session(session_id)
            print(f"✓ Generated {len(session.questions)} questions")

            print("\nGenerating AI videos (this may take 2-3 minutes)...")
            # Videos are already being generated in create_interview

            # Wait for videos to be ready
            max_wait = 300  # 5 minutes
            waited = 0
            while waited < max_wait:
                session = self.service.get_session(session_id)
                if session.status == InterviewStatus.READY:
                    break
                await asyncio.sleep(2)
                waited += 2
                if waited % 10 == 0:
                    print(f"  Still generating... ({waited}s elapsed)")

            print(f"✓ Generated videos for {len(session.questions)} questions")
            print(f"\n✓ Interview ready! Session ID: {session_id}")

            return session_id

        except Exception as e:
            print(f"\n✗ Error: {e}")
            logger.error(f"Failed to create interview: {e}")
            raise

    def start_interview(self, session_id: str):
        """Start an interactive interview session"""
        session = self.service.get_session(session_id)
        if not session:
            print(f"Error: Session {session_id} not found")
            return

        if session.status != InterviewStatus.READY:
            print(f"Error: Interview is not ready (status: {session.status.value})")
            return

        print(f"\n{'='*60}")
        print(f"  AI MOCK INTERVIEW")
        print(f"  Position: {session.job_description.position_title or 'N/A'}")
        print(f"  Questions: {len(session.questions)}")
        print(f"{'='*60}\n")

        for idx, question in enumerate(session.questions, 1):
            print(f"\nQuestion {idx}/{len(session.questions)}:")
            print(f"Type: {question.question_type.value}")
            print(f"\n{question.question_text}")

            # Display video
            if question.video_url:
                print(f"\n🎥 Video URL: {question.video_url}")
                print("   Opening video in browser...")
                webbrowser.open(question.video_url)
                print("   (If video doesn't open, copy the URL above and paste it in your browser)")

            print(f"\n{'='*60}")
            print("Your answer (type your response, then press Enter twice):")

            # Collect multi-line answer
            lines = []
            empty_lines = 0
            while True:
                try:
                    line = input()
                    if line == "":
                        empty_lines += 1
                        if empty_lines >= 2:
                            break
                    else:
                        empty_lines = 0
                        lines.append(line)
                except EOFError:
                    break

            answer_text = "\n".join(lines).strip()

            if not answer_text:
                print("Skipping question...")
                continue

            # Evaluate answer
            print("\nEvaluating your answer...")
            feedback = self.service.evaluate_answer(
                session_id,
                question.question_id,
                answer_text
            )

            # Show feedback
            print(f"\n{'='*60}")
            print(f"FEEDBACK - Score: {feedback.score}/10")
            print(f"\n✓ Strengths:")
            for strength in feedback.strengths:
                print(f"  • {strength}")
            print(f"\n⚠ Areas to Improve:")
            for improvement in feedback.improvements:
                print(f"  • {improvement}")

            if feedback.star_analysis and question.question_type.value == "behavioral":
                star = feedback.star_analysis
                print(f"\nSTAR Analysis (Score: {star.score:.2f}):")
                print(f"  Situation: {'✓' if star.situation else '✗'}")
                print(f"  Task: {'✓' if star.task else '✗'}")
                print(f"  Action: {'✓' if star.action else '✗'}")
                print(f"  Result: {'✓' if star.result else '✗'}")

            print(f"{'='*60}")

            # Ask to continue
            if idx < len(session.questions):
                continue_input = input("\nContinue to next question? (y/n): ")
                if continue_input.lower() != 'y':
                    break

        # Calculate final results
        self._show_final_results(session_id)

    def _show_final_results(self, session_id: str):
        """Calculate and display final results"""
        results = self.service.get_results(session_id)

        if not results:
            print("No answers to evaluate")
            return

        print(f"\n\n{'='*60}")
        print("  INTERVIEW COMPLETE")
        print(f"{'='*60}")
        print(f"\nOverall Score: {results.overall_score:.1f}/100")
        print(f"Questions Answered: {results.questions_answered}")
        print(f"Questions Skipped: {results.questions_skipped}")

        if results.breakdown:
            print("\nScore Breakdown by Type:")
            for q_type, score in results.breakdown.items():
                print(f"  {q_type.capitalize()}: {score:.1f}/100")

        print(f"\nReadiness: {results.readiness_assessment}")
        print(f"\n{'='*60}")

    def list_interviews(self):
        """List all interview sessions"""
        sessions = self.service.list_interviews()

        if not sessions:
            print("No interviews found")
            return

        print(f"\n{'='*80}")
        print(f"{'Session ID':<40} {'Status':<15} {'Score':<10} {'Date'}")
        print(f"{'='*80}")

        for session in sessions:
            score = session.results.overall_score if session.results else 0
            date = session.created_at.strftime("%Y-%m-%d %H:%M")
            print(f"{session.session_id:<40} {session.status.value:<15} {score:<10.1f} {date}")

        print(f"{'='*80}\n")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="AI Mock Interviewer - Practice interviews with AI"
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Create interview
    create_parser = subparsers.add_parser('create', help='Create a new interview')
    create_parser.add_argument('--resume', required=True, help='Path to resume file')
    create_parser.add_argument('--job', required=True, help='Path to job description file')
    create_parser.add_argument('--difficulty', default='mid', choices=['junior', 'mid', 'senior'])
    create_parser.add_argument('--type', default='mixed', choices=['behavioral', 'technical', 'mixed'])
    create_parser.add_argument('--questions', type=int, default=8, help='Number of questions')
    create_parser.add_argument('--config', help='Path to config file')

    # Start interview
    start_parser = subparsers.add_parser('start', help='Start an interview')
    start_parser.add_argument('session_id', help='Interview session ID')
    start_parser.add_argument('--config', help='Path to config file')

    # List interviews
    list_parser = subparsers.add_parser('list', help='List all interviews')
    list_parser.add_argument('--config', help='Path to config file')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    cli = MockInterviewCLI(args.config if hasattr(args, 'config') else None)

    if args.command == 'create':
        session_id = asyncio.run(cli.create_interview(
            args.resume,
            args.job,
            args.difficulty,
            args.type,
            args.questions
        ))
        print(f"\nTo start the interview, run:")
        print(f"  python -m ai_mock_interviewer.cli start {session_id}")

    elif args.command == 'start':
        cli.start_interview(args.session_id)

    elif args.command == 'list':
        cli.list_interviews()


if __name__ == "__main__":
    main()
