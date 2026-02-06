# AI Mock Interviewer

Standalone AI-powered mock interview system that generates personalized interview questions based on resumes and job descriptions, creates AI video avatars to present the questions, and evaluates user responses using advanced AI.

## Features

- **Personalized Question Generation**: Uses Google Gemini AI to generate interview questions tailored to your resume and target job
- **AI Video Avatars**: Creates realistic talking avatar videos using D-ID API
- **Answer Evaluation**: Provides detailed feedback on your answers with scores and improvement suggestions
- **STAR Method Analysis**: Automatically checks behavioral answers for STAR (Situation, Task, Action, Result) components
- **Video Caching**: Reduces costs by caching generated videos for reuse
- **CLI Interface**: Easy-to-use command-line tool
- **Python API**: Can be used as a library in your own applications

## Installation

```bash
# Clone the repository
cd CareerCompanion

# Install dependencies
pip install -r ai_mock_interviewer/requirements.txt

# Or install as a package
pip install -e ai_mock_interviewer/
```

## Configuration

Create a `.env` file in your project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
DID_API_KEY=your_did_api_key_here
```

Get API keys:
- **Gemini API**: https://aistudio.google.com/app/apikey
- **D-ID API**: https://studio.d-id.com/account-settings

## Usage

### CLI Usage

#### 1. Create a New Interview

```bash
python -m ai_mock_interviewer.cli create \
  --resume path/to/resume.txt \
  --job path/to/job_description.txt \
  --difficulty mid \
  --type mixed \
  --questions 8
```

This will:
- Generate 8 personalized interview questions
- Create AI video avatars for each question
- Return a session ID

#### 2. Start the Interview

```bash
python -m ai_mock_interviewer.cli start <session_id>
```

This will:
- Display each question with video URL
- Prompt you to type your answer
- Provide immediate feedback with scores
- Show final results when complete

#### 3. List All Interviews

```bash
python -m ai_mock_interviewer.cli list
```

### Python API Usage

```python
import asyncio
from ai_mock_interviewer import MockInterviewer
from ai_mock_interviewer.models import (
    ResumeInput,
    JobDescriptionInput,
    InterviewConfig,
    DifficultyLevel,
    InterviewType
)

async def main():
    # Initialize service
    interviewer = MockInterviewer(
        gemini_api_key="your-key",
        did_api_key="your-key"
    )

    # Load resume and job description
    with open("resume.txt", "r") as f:
        resume_text = f.read()

    with open("job.txt", "r") as f:
        job_text = f.read()

    resume = ResumeInput(raw_text=resume_text)
    job_desc = JobDescriptionInput(raw_text=job_text)

    # Configure interview
    config = InterviewConfig(
        difficulty=DifficultyLevel.MID,
        interview_type=InterviewType.MIXED,
        num_questions=8
    )

    # Create interview
    session_id = await interviewer.create_interview(
        resume=resume,
        job_description=job_desc,
        config=config
    )

    print(f"Interview created: {session_id}")

    # Get session
    session = interviewer.get_session(session_id)

    # Simulate answering questions
    for question in session.questions:
        print(f"\nQ: {question.question_text}")
        print(f"Video: {question.video_url}")

        # User provides answer
        user_answer = input("Your answer: ")

        # Evaluate answer
        feedback = interviewer.evaluate_answer(
            session_id=session_id,
            question_id=question.question_id,
            answer_text=user_answer
        )

        print(f"Score: {feedback.score}/10")
        print(f"Strengths: {feedback.strengths}")
        print(f"Improvements: {feedback.improvements}")

    # Get final results
    results = interviewer.get_results(session_id)
    print(f"\nOverall Score: {results.overall_score}/100")
    print(f"Readiness: {results.readiness_assessment}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Architecture

```
ai_mock_interviewer/
├── __init__.py              # Package initialization
├── models.py                # Pydantic data models
├── config.py                # Configuration management
├── service.py               # Main service wrapper
├── cli.py                   # Command-line interface
├── interview_generator.py   # Question generation (Gemini)
├── video_service.py         # Video generation (D-ID)
├── evaluation_service.py    # Answer evaluation (Gemini)
├── state_manager.py         # Session state management
├── cache_manager.py         # Video caching
├── prompts/                 # AI prompts
│   ├── question_generation.py
│   └── answer_evaluation.py
├── storage/                 # Storage backends
│   └── sqlite_storage.py
└── utils/                   # Utilities
    ├── logger.py
    ├── validators.py
    └── helpers.py
```

## Configuration Options

Create a `config.yaml` file:

```yaml
did:
  default_avatar: "amy"
  default_voice: "en-US-JennyNeural"
  timeout: 90
  max_concurrent: 3

gemini:
  model_name: "gemini-2.0-flash-exp"
  question_generation_temperature: 0.7
  evaluation_temperature: 0.4

cache:
  enabled: true
  ttl_days: 30

interview:
  default_num_questions: 8
  min_questions: 3
  max_questions: 15

storage:
  sqlite_path: "./data/interviews.db"

log_level: "INFO"
log_file: "./logs/mock_interviewer.log"
```

## Cost Considerations

### Per Interview Costs (8 questions):
- **Gemini API** (question generation): ~$0.05
- **Gemini API** (8 evaluations): ~$0.10
- **D-ID API** (8 videos × 2 min): ~$4.80
- **Total**: ~$4.95 per interview

### With 50% Cache Hit Rate:
- **D-ID API** (4 videos): ~$2.40
- **Total**: ~$2.55 per interview

### Cost Optimization:
- Video caching is enabled by default (30-day TTL)
- Common questions are reused across interviews
- Videos are cached by question text + avatar + voice

## Examples

See the `examples/` directory for:
- `example_usage.py` - Complete workflow example
- `example_resume.txt` - Sample resume format
- `example_job.txt` - Sample job description format

## Testing

```bash
# Run unit tests
pytest ai_mock_interviewer/tests/

# Run with coverage
pytest --cov=ai_mock_interviewer ai_mock_interviewer/tests/
```

## Troubleshooting

### API Key Errors
Ensure your `.env` file has valid API keys:
```bash
GEMINI_API_KEY=your_key_here
DID_API_KEY=your_key_here
```

### Video Generation Timeout
If video generation times out, check:
- D-ID API status: https://status.d-id.com
- Increase timeout in config: `did.timeout: 120`

### Module Import Errors
Ensure you're running from the correct directory:
```bash
# From CareerCompanion directory
python -m ai_mock_interviewer.cli
```

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
