#!/usr/bin/env python3
"""CLI entry point for the Interview Orb."""

import argparse
import sys
from pathlib import Path

from .models import InterviewConfig
from .interviewer import Interviewer


def load_file(filepath: str) -> str:
    path = Path(filepath)
    if not path.exists():
        print(f"Error: file not found: {filepath}")
        sys.exit(1)
    return path.read_text()


def main():
    parser = argparse.ArgumentParser(description="AI Interview Orb — real-time mock interviews")
    parser.add_argument("--resume", required=True, help="Path to resume text file")
    parser.add_argument("--job-description", required=True, help="Path to job description text file")
    parser.add_argument("--topics", help="Path to additional topics file (optional)")
    parser.add_argument("--max-questions", type=int, default=10, help="Max questions before wrap-up (default: 10)")

    args = parser.parse_args()

    resume = load_file(args.resume)
    job_description = load_file(args.job_description)
    topics = load_file(args.topics) if args.topics else ""

    interview_config = InterviewConfig(
        job_description=job_description,
        resume=resume,
        additional_topics=topics,
        max_questions=args.max_questions,
    )

    interviewer = Interviewer(interview_config)
    session = interviewer.run()

    print("\n--- Full Transcript ---\n")
    print(session.get_transcript())


if __name__ == "__main__":
    main()
