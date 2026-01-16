"""
Core configuration and constants for the resume tailoring system.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_TEMPERATURE = 0.3
GEMINI_TIMEOUT = 120
GEMINI_MAX_RETRIES = 3

# Semantic Matching Configuration
SEMANTIC_MODEL = "all-MiniLM-L6-v2"
SEMANTIC_SIMILARITY_THRESHOLD = 0.5
SEMANTIC_WEAK_MATCH_THRESHOLD = 0.75

# Context Window Limits (increased for better analysis)
# Gemini 2.5 Flash supports 1M tokens - we can be generous
CONTEXT_JOB_DESCRIPTION = 8000  # Full job description
CONTEXT_RESUME_TEXT = 8000  # Full resume content
CONTEXT_RESUME_JSON = 15000  # Full structured data
CONTEXT_COVER_LETTER_JD = 4000  # Cover letter job context
CONTEXT_COVER_LETTER_RESUME = 6000  # Cover letter resume context

# Iterative Refinement
MAX_REFINEMENT_ITERATIONS = 3
REFINEMENT_TEMPERATURE = 0.4  # Slightly higher for creativity in refinements

# PDF Generation Configuration
DEFAULT_RESUME_TEMPLATE = "jake"  # Future: support multiple templates
MIN_GPA_DISPLAY = 2.8
PAGE_SIZE = "letter"

# File paths
BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "outputs"

# Ensure directories exist
OUTPUT_DIR.mkdir(exist_ok=True)
