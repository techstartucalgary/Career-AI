"""
Example usage of AI Mock Interviewer
"""

import asyncio
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_mock_interviewer.service import MockInterviewer
from ai_mock_interviewer.models import (
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    DifficultyLevel,
    InterviewType
)


async def main():
    """Run a complete mock interview workflow"""

    # Initialize the service
    print("Initializing AI Mock Interviewer...")
    interviewer = MockInterviewer(
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        did_api_key=os.getenv("DID_API_KEY")
    )

    # Load example resume and job description
    examples_dir = Path(__file__).parent

    with open(examples_dir / "example_resume.txt", "r") as f:
        resume_text = f.read()

    with open(examples_dir / "example_job.txt", "r") as f:
        job_text = f.read()

    # Create input objects
    resume = ResumeInput(raw_text=resume_text)
    job_desc = JobDescriptionInput(
        raw_text=job_text,
        company_name="TechCorp",
        position_title="Senior Software Engineer"
    )

    # Configure the interview
    config = InterviewConfig(
        difficulty=DifficultyLevel.MID,
        interview_type=InterviewType.MIXED,
        num_questions=5,  # Use 5 for faster example
        avatar_id="amy",
        voice_id="en-US-JennyNeural"
    )

    # Create the interview
    print("\n" + "="*60)
    print("CREATING MOCK INTERVIEW")
    print("="*60)
    print(f"Position: {job_desc.position_title}")
    print(f"Company: {job_desc.company_name}")
    print(f"Difficulty: {config.difficulty.value}")
    print(f"Questions: {config.num_questions}")
    print()

    try:
        session_id = await interviewer.create_interview(
            resume=resume,
            job_description=job_desc,
            config=config
        )

        print(f"✓ Interview created successfully!")
        print(f"✓ Session ID: {session_id}")

        # Get the session
        session = interviewer.get_session(session_id)

        # Display questions
        print("\n" + "="*60)
        print("INTERVIEW QUESTIONS")
        print("="*60)

        for idx, question in enumerate(session.questions, 1):
            print(f"\nQuestion {idx}:")
            print(f"Type: {question.question_type.value}")
            print(f"Text: {question.question_text}")
            print(f"Video: {question.video_url}")
            print(f"Duration: {question.video_duration}s")

        # Simulate answering questions
        print("\n" + "="*60)
        print("ANSWERING QUESTIONS")
        print("="*60)

        example_answers = [
            "In my previous role at TechCo, I built a microservices architecture that needed to handle 1M requests per day. The situation was that our monolithic application was becoming a bottleneck. My task was to break it down into independent services. I approached this by first identifying domain boundaries, then gradually extracting services one by one. I implemented an API gateway for routing and used Redis for caching. The result was a 60% reduction in response time and the system successfully handled 1.5M requests per day.",

            "I would start by understanding the requirements and constraints. For a system handling 100K requests per second, I'd use a distributed architecture with load balancers, multiple application servers, and a caching layer like Redis. I'd implement database sharding for horizontal scaling and use a message queue like RabbitMQ for asynchronous processing. For data storage, I'd use a combination of SQL for transactional data and NoSQL for high-throughput operations.",

            "In that situation, we had a production incident where the database was running out of connections. I quickly identified the issue using monitoring tools and implemented connection pooling as a temporary fix. Then I worked with the team to implement a more permanent solution using read replicas. This reduced the load on the primary database by 70%.",

            "I see React and Node.js are key technologies. For the frontend, I'd use React with Redux for state management and implement proper component architecture with reusable components. On the backend, I'd structure the Node.js application using Express, implement proper error handling, and use async/await for better code readability.",

            "When a team member disagreed with my technical approach, I scheduled a meeting to discuss both approaches. I listened to their concerns, presented data to support my proposal, and we ultimately decided to prototype both solutions. The prototype revealed that a hybrid approach was best, combining elements from both ideas. This experience taught me the importance of collaboration and being open to different perspectives."
        ]

        for idx, question in enumerate(session.questions):
            if idx >= len(example_answers):
                break

            print(f"\nQuestion {idx+1}: {question.question_text[:80]}...")
            print(f"Answer: {example_answers[idx][:100]}...")

            # Evaluate answer
            feedback = interviewer.evaluate_answer(
                session_id=session_id,
                question_id=question.question_id,
                answer_text=example_answers[idx],
                time_taken_seconds=120
            )

            print(f"\n✓ Evaluated - Score: {feedback.score}/10")
            print(f"  Strengths: {', '.join(feedback.strengths[:2])}")
            print(f"  Improvements: {', '.join(feedback.improvements[:2])}")

            if feedback.star_analysis:
                print(f"  STAR Score: {feedback.star_analysis.score:.2f}")

        # Get final results
        print("\n" + "="*60)
        print("FINAL RESULTS")
        print("="*60)

        results = interviewer.get_results(session_id)

        if results:
            print(f"\nOverall Score: {results.overall_score:.1f}/100")
            print(f"Questions Answered: {results.questions_answered}")
            print(f"Questions Skipped: {results.questions_skipped}")

            if results.breakdown:
                print("\nScore Breakdown by Type:")
                for q_type, score in results.breakdown.items():
                    print(f"  {q_type.capitalize()}: {score:.1f}/100")

            print(f"\nReadiness Assessment:")
            print(f"  {results.readiness_assessment}")

        print("\n" + "="*60)
        print("EXAMPLE COMPLETE")
        print("="*60)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
