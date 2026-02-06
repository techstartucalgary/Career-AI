# AI Mock Interviewer - Quick Start Guide

Get up and running with AI Mock Interviewer in 5 minutes!

## Prerequisites

- Python 3.9 or higher
- Google Gemini API key
- D-ID API key

## Step 1: Installation

```bash
# Navigate to the CareerCompanion directory
cd /path/to/CareerCompanion

# Install dependencies
pip install -r ai_mock_interviewer/requirements.txt
```

## Step 2: Configuration

Create a `.env` file in the CareerCompanion root directory:

```bash
# Create .env file
touch .env

# Add your API keys
echo "GEMINI_API_KEY=your_gemini_api_key" >> .env
echo "DID_API_KEY=your_did_api_key" >> .env
```

**Get API Keys:**
- Gemini: https://aistudio.google.com/app/apikey
- D-ID: https://studio.d-id.com/account-settings

## Step 3: Prepare Your Files

Create two text files:

### 1. `my_resume.txt`
```
John Doe
Software Engineer
john@email.com | (123) 456-7890

EXPERIENCE
Software Engineer at TechCorp (2020-Present)
- Built microservices handling 1M requests/day
- Led team of 5 engineers
...
```

### 2. `job_description.txt`
```
Senior Software Engineer - Google

We're looking for a Senior SWE to join our team...

Requirements:
- 5+ years experience
- Strong system design skills
...
```

Or use the example files provided:
```bash
cp ai_mock_interviewer/examples/example_resume.txt my_resume.txt
cp ai_mock_interviewer/examples/example_job.txt job_description.txt
```

## Step 4: Create Your First Interview

```bash
# Create an interview
python -m ai_mock_interviewer.cli create \
  --resume my_resume.txt \
  --job job_description.txt \
  --difficulty mid \
  --type mixed \
  --questions 5
```

This will:
- ✓ Generate 5 personalized questions
- ✓ Create AI video avatars (takes 2-3 minutes)
- ✓ Return a session ID

**Output:**
```
Generating personalized questions...
✓ Generated 5 questions

Generating AI videos (this may take 2-3 minutes)...
✓ Generated videos for 5 questions

✓ Interview ready! Session ID: a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8

To start the interview, run:
  python -m ai_mock_interviewer.cli start a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8
```

## Step 5: Start the Interview

```bash
# Use the session ID from Step 4
python -m ai_mock_interviewer.cli start <session_id>
```

This will:
1. Display each question with video URL
2. Prompt you to type your answer
3. Provide immediate feedback with scores
4. Show STAR analysis for behavioral questions
5. Display final results

**Example Interaction:**
```
Question 1/5:
Type: behavioral

I see you built a microservices architecture at TechCorp. Tell me about a time when the system experienced an unexpected failure under load...

Video: https://d-id.com/video/abc123

Your answer (press Enter twice to submit):
> In my role at TechCorp, we had a production incident...
> [Your answer here]
>

Evaluating your answer...

FEEDBACK - Score: 8.5/10

✓ Strengths:
  • Clear STAR structure with specific situation
  • Quantifiable results (60% improvement)
  • Detailed technical approach

⚠ Areas to Improve:
  • Could elaborate more on team collaboration
  • Consider mentioning preventive measures

STAR Analysis (Score: 0.75):
  Situation: ✓
  Task: ✓
  Action: ✓
  Result: ✗

Continue to next question? (y/n): y
```

## Step 6: View Results

After completing the interview:

```
INTERVIEW COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Score: 82.5/100
Questions Answered: 5
Questions Skipped: 0

Score Breakdown by Type:
  Behavioral: 85.0/100
  Technical: 78.0/100
  Situational: 84.0/100

Readiness: Well Prepared - Minor improvements needed
```

## Step 7: List All Interviews

```bash
python -m ai_mock_interviewer.cli list
```

**Output:**
```
Session ID                               Status      Score      Date
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8     completed   82.5       2026-01-20 15:30
```

## Python API Usage

Want to integrate into your own application?

```python
import asyncio
from ai_mock_interviewer import MockInterviewer
from ai_mock_interviewer.models import (
    ResumeInput, JobDescriptionInput, InterviewConfig,
    DifficultyLevel, InterviewType
)

async def main():
    # Initialize
    interviewer = MockInterviewer()

    # Load files
    with open("my_resume.txt") as f:
        resume = ResumeInput(raw_text=f.read())

    with open("job_description.txt") as f:
        job_desc = JobDescriptionInput(raw_text=f.read())

    # Configure
    config = InterviewConfig(
        difficulty=DifficultyLevel.MID,
        interview_type=InterviewType.MIXED,
        num_questions=5
    )

    # Create interview
    session_id = await interviewer.create_interview(
        resume, job_desc, config
    )

    # Get questions
    session = interviewer.get_session(session_id)
    for question in session.questions:
        print(f"Q: {question.question_text}")
        print(f"Video: {question.video_url}")

        # Get user answer (from your UI)
        answer = input("Your answer: ")

        # Evaluate
        feedback = interviewer.evaluate_answer(
            session_id, question.question_id, answer
        )
        print(f"Score: {feedback.score}/10")

    # Get results
    results = interviewer.get_results(session_id)
    print(f"Overall: {results.overall_score}/100")

asyncio.run(main())
```

## Tips for Best Results

### 1. Resume Format
- Include specific achievements with metrics
- Mention technologies and tools used
- Describe your role and impact

### 2. Answer Format
For behavioral questions, use STAR method:
- **S**ituation: Set the context
- **T**ask: Describe the challenge
- **A**ction: Explain what you did
- **R**esult: Share the outcome with metrics

### 3. Cost Optimization
- Videos are cached for 30 days
- Reusing similar questions saves costs
- Expected: $2.55 per interview with caching

## Troubleshooting

### "API key not found"
```bash
# Check your .env file exists
ls -la .env

# Verify contents
cat .env
```

### "Module not found"
```bash
# Run from CareerCompanion directory
cd /path/to/CareerCompanion

# Check installation
pip list | grep google-generativeai
pip list | grep pydantic
```

### "Video generation timeout"
```bash
# Increase timeout in config.yaml
did:
  timeout: 120  # Default is 90
```

## Next Steps

- Try different difficulty levels (junior/mid/senior)
- Experiment with interview types (behavioral/technical/mixed)
- Review the comprehensive documentation in README.md
- Check out example_usage.py for advanced usage

## Support

Need help? Check:
- README.md - Full documentation
- examples/ - Code examples
- GitHub Issues - Report bugs

Happy interviewing! 🎯
