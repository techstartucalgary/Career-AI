<<<<<<< HEAD
# Career-AI
=======
# CareerCompanion

AI-powered resume tailoring system with semantic matching, iterative refinement, and ATS optimization.

## Features

- **Semantic Matching**: Uses sentence-transformers to understand skill relationships beyond keywords
- **Smart Gap Analysis**: Chain-of-thought reasoning identifies what's missing and asks targeted questions
- **Explicit Keyword Optimization**: Extracts priority keywords from job descriptions and ensures coverage
- **Iterative Refinement**: Reviews and improves the tailored resume until quality threshold is met
- **Cover Letter Generation**: Creates personalized, evidence-based cover letters
- **ATS-Friendly Output**: Generates clean PDF resumes using Jake's resume template format

## Requirements

- Python 3.9+
- Google Gemini API key

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd CareerCompanion

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env  # or create .env manually
```

Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

### Option 1: Command Line Interface

Basic usage:
```bash
python cli.py --resume resume.pdf --job-description job.txt -o tailored.pdf
```

With cover letter:
```bash
python cli.py --resume resume.pdf --job-description job.txt \
  --cover-letter --company "Google" --position "Software Engineer" \
  -o tailored.pdf
```

Skip interactive questions:
```bash
python cli.py --resume resume.pdf --job-description job.txt --skip-questions
```

Disable semantic matching (faster, less accurate):
```bash
python cli.py --resume resume.pdf --job-description job.txt --no-semantic
```

#### CLI Arguments

| Argument | Description |
|----------|-------------|
| `--resume` | Path to your resume PDF (required) |
| `--job-description` | Path to job description text file (required) |
| `-o, --output` | Output PDF path (default: `tailored_resume.pdf`) |
| `--cover-letter` | Generate cover letter |
| `--company` | Company name (required with `--cover-letter`) |
| `--position` | Position title (required with `--cover-letter`) |
| `--cover-letter-output` | Cover letter output path |
| `--no-semantic` | Disable semantic matching |
| `--skip-questions` | Skip interactive Q&A |

### Option 2: Python API

#### Basic Workflow

```python
from service import ResumeTailoringService

# Initialize service
service = ResumeTailoringService()

# Parse resume
resume = service.parse_resume("resume.pdf")

# Read job description
with open("job.txt") as f:
    job_description = f.read()

# Analyze job fit (semantic matching)
analysis = service.analyze_job_fit(resume, job_description)
print(f"Match Score: {analysis.overall_match:.1%}")
print(f"Missing Skills: {analysis.top_missing_skills}")

# Generate enhancement questions
questions, summary = service.generate_enhancement_questions(
    resume, job_description, analysis
)

# Collect answers (from user or skip)
user_answers = {1: "Led team of 5", 2: "Reduced latency by 40%"}

# Tailor resume
tailored = service.tailor_resume(resume, job_description, user_answers, questions)

# Generate PDF
service.generate_resume_pdf(tailored, "tailored_resume.pdf")
```

#### With Iterative Refinement

```python
from service import ResumeTailoringService

service = ResumeTailoringService()
resume = service.parse_resume("resume.pdf")

# Tailor first
tailored = service.tailor_resume(resume, job_description, {}, [])

# Refine iteratively (reviews and improves until score >= 90)
refined, feedback = service.refine_resume(
    tailored,
    job_description,
    max_iterations=3  # Will stop early if quality is good
)

print(f"Final Score: {feedback.get('score')}/100")
print(f"Keyword Coverage: {feedback.get('keyword_coverage'):.0%}")
```

#### Complete Workflow (All-in-One)

```python
from service import ResumeTailoringService

service = ResumeTailoringService()

results = service.complete_tailoring_workflow(
    resume_pdf_path="resume.pdf",
    job_description=job_description,
    output_resume_path="tailored.pdf",
    user_answers={},  # Or provide answers

    # Cover letter options
    generate_cover_letter=True,
    company_name="Google",
    position="Software Engineer",

    # Refinement options (new!)
    enable_refinement=True,       # Default: True
    max_refinement_iterations=2   # Default: 2
)

# Access results
print(f"Analysis: {results['analysis']}")
print(f"Questions: {len(results['questions'])}")
print(f"Refinement Score: {results['refinement_feedback'].get('score')}")
```

#### Extract Job Keywords

```python
# Understand what keywords to emphasize
keywords = service.extract_job_keywords(job_description)
print(f"Priority Keywords: {keywords[:10]}")
# Output: ['Python', 'AWS', 'machine learning', 'distributed systems', ...]
```

### Option 3: Direct Module Usage

For more control, use the modules directly:

```python
from ai_service import AIService
from parser import ResumeParser
from semantic_matcher import SemanticMatcher
from pdf_generators import PDFGenerator

# Parse resume
parser = ResumeParser()
resume = parser.parse_resume_from_pdf("resume.pdf")

# Semantic analysis
matcher = SemanticMatcher()
semantic_result = matcher.find_semantic_matches(resume.to_text(), job_description)

# AI operations
ai = AIService()
questions, analysis = ai.analyze_gaps(resume, job_description, semantic_result)
tailored = ai.tailor_resume(resume, job_description, answers, questions)
refined, feedback = ai.review_and_refine(tailored, job_description)

# Generate PDF
pdf = PDFGenerator()
pdf.generate_resume_pdf(refined, "output.pdf")
```

## Architecture

```
CareerCompanion/
├── cli.py              # Command-line interface
├── service.py          # Main orchestration layer (use this)
├── ai_service.py       # LLM interactions (Gemini)
├── semantic_matcher.py # Embedding-based skill matching
├── parser.py           # PDF extraction & resume parsing
├── models.py           # Pydantic data models
├── pdf_generators.py   # PDF rendering (Jake's template)
├── config.py           # Configuration & constants
└── outputs/            # Generated PDFs
```

## Configuration

Edit `config.py` to customize:

```python
# LLM Settings
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_TEMPERATURE = 0.3

# Context Window Limits (chars)
CONTEXT_JOB_DESCRIPTION = 8000   # Full job description
CONTEXT_RESUME_TEXT = 8000       # Full resume content
CONTEXT_RESUME_JSON = 15000      # Full structured data

# Semantic Matching
SEMANTIC_MODEL = "all-MiniLM-L6-v2"
SEMANTIC_SIMILARITY_THRESHOLD = 0.5
SEMANTIC_WEAK_MATCH_THRESHOLD = 0.75

# Iterative Refinement
MAX_REFINEMENT_ITERATIONS = 3
REFINEMENT_TEMPERATURE = 0.4
```

## How It Works

### 1. Resume Parsing
- Extracts text from PDF using pypdf
- Uses LLM to structure into JSON (header, education, experience, projects, skills)

### 2. Semantic Analysis
- Extracts key phrases from job description and resume
- Generates embeddings using sentence-transformers
- Calculates cosine similarity to find matches and gaps
- Identifies missing skills that candidate might have but didn't mention

### 3. Gap Analysis (Chain-of-Thought)
- LLM analyzes resume vs job requirements step-by-step
- Generates targeted questions specific to each role/project
- Uses few-shot examples for better question quality

### 4. Resume Tailoring
- Explicitly extracts priority keywords from job description
- Enhances bullet points using user answers
- Integrates keywords naturally where appropriate
- Uses few-shot examples for better transformations

### 5. Iterative Refinement (New!)
- Reviews tailored resume for quality (0-100 score)
- Checks keyword coverage percentage
- Identifies weak bullets and missing keywords
- Applies targeted fixes until score >= 90 or max iterations

### 6. PDF Generation
- Uses ReportLab for PDF generation
- Follows Jake's resume template format
- ATS-optimized single-column layout

## Input File Formats

### Resume PDF
Any standard PDF resume. The system will:
- Extract text from all pages
- Parse into structured sections
- Handle various formats and layouts

### Job Description (Text File)
Plain text file containing the job posting. Example:
```
Software Engineer - Google

About the role:
We're looking for engineers to build scalable systems...

Requirements:
- 3+ years of experience with Python
- Experience with distributed systems
- Strong problem-solving skills
...
```

## Output

### Tailored Resume PDF
- Clean, ATS-friendly format
- Jake's resume template style
- Enhanced bullet points with job-relevant keywords

### Cover Letter PDF (Optional)
- 3-4 paragraph structure
- Personalized with specific examples from resume
- Company and position specific

## Troubleshooting

### "API key not found"
Ensure `GEMINI_API_KEY` is set in your `.env` file or environment.

### "Parsing failed"
- Ensure your resume PDF is text-based (not scanned image)
- Try a different PDF or convert to text first

### Semantic matching is slow
- First run downloads the model (~80MB)
- Use `--no-semantic` for faster (but less accurate) results

### Low quality score after refinement
- Provide more detailed answers to the questions
- Ensure your resume has relevant experience for the job

## License

MIT License
>>>>>>> b588eef (AI implementation)
