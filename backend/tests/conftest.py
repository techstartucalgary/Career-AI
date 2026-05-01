"""
Shared test fixtures for the backend test suite.
"""
import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Add backend to sys.path so imports work without installing as a package
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# ── Mock database before any adapter imports ────────────────────────
# We don't want tests to require a running MongoDB instance.
_mock_col = MagicMock()
_mock_col.find_one.return_value = None
_mock_col.update_one.return_value = None
_mock_col.insert_one.return_value = MagicMock(inserted_id="mock_id")

# Patch database module before importing adapters
import database
database.field_meanings_col = _mock_col
database.applications_col = _mock_col
database.activity_events_col = _mock_col
database.agent_sessions_col = _mock_col
database.worker_health_col = _mock_col


# ── Fixtures directory ──────────────────────────────────────────────
FIXTURES_DIR = Path(__file__).resolve().parent / "adapters" / "fixtures"


@pytest.fixture
def fixture_swe_full() -> dict:
    """Full SWE job with standard + demographic questions."""
    with open(FIXTURES_DIR / "greenhouse_swe_full.json") as f:
        return json.load(f)


@pytest.fixture
def fixture_minimal() -> dict:
    """Minimal job with just name + email + resume."""
    with open(FIXTURES_DIR / "greenhouse_minimal.json") as f:
        return json.load(f)


@pytest.fixture
def fixture_custom_questions() -> dict:
    """Job with custom questions, multi-select, checkbox."""
    with open(FIXTURES_DIR / "greenhouse_custom_questions.json") as f:
        return json.load(f)


@pytest.fixture
def sample_profile() -> dict:
    """A realistic user profile for mapper tests."""
    return {
        "email": "jane.doe@example.com",
        "citizenship": "United States citizen",
        "work_authorization_status": "Authorized to work in the US",
        "profile": {
            "first_name": "Jane",
            "last_name": "Doe",
            "display_name": "Jane Doe",
            "phone": "+1-555-867-5309",
            "location": "San Francisco, CA, US",
            "linkedin": "https://linkedin.com/in/janedoe",
            "github": "https://github.com/janedoe",
            "website": "https://janedoe.dev",
        },
        "resume": {
            "extracted_data": {
                "experience": [
                    {"company": "Acme Corp", "title": "Senior Engineer", "years": "3"},
                    {"company": "Startup Inc", "title": "Software Engineer", "years": "2"},
                ],
                "education": [
                    {
                        "school": "University of California, Berkeley",
                        "degree": "Bachelor of Science",
                        "field": "Computer Science",
                        "gpa": "3.8",
                        "graduation_date": "2019-05",
                    }
                ],
            },
            "file_data": "base64_resume_data_here",
        },
        "job_preferences": {
            "work_arrangement": "hybrid",
        },
    }
