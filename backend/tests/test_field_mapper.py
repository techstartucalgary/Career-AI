"""
Tests for field_mapper.py — name splitting, work auth inference,
location country inference, phone normalization.
"""
import sys
from pathlib import Path

# Backend on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from models_application import FormField
from field_mapper import map_field, MappedValue, _normalize_phone, _infer_country_from_region


# ── Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def canadian_profile():
    """Canadian citizen in Calgary with full profile."""
    return {
        "email": "test@example.com",
        "citizenship": "Canadian citizen",
        "work_authorization_status": "citizen",
        "profile": {
            "first_name": "Test",
            "last_name": "User",
            "display_name": "Test User",
            "phone": "403-973-3139",
            "location": "Calgary, AB",
            "linkedin": "https://linkedin.com/in/testuser",
        },
        "resume": {
            "file_data": "base64data",
            "extracted_data": {"experience": [], "education": []},
        },
        "job_preferences": {
            "locations": ["Calgary, AB"],
            "work_arrangement": "hybrid",
        },
    }


@pytest.fixture
def display_name_only_profile():
    """Profile with display_name but no first_name/last_name."""
    return {
        "email": "display@example.com",
        "profile": {
            "display_name": "Jane Doe-Smith",
            "phone": "+1-555-867-5309",
            "location": "Toronto, ON",
        },
        "job_preferences": {"locations": ["Toronto, ON"]},
    }


@pytest.fixture
def us_profile():
    """US citizen in California."""
    return {
        "email": "us@example.com",
        "citizenship": "United States citizen",
        "work_authorization_status": "authorized",
        "profile": {
            "first_name": "John",
            "last_name": "Smith",
            "phone": "(415) 555-0123",
            "location": "San Francisco, CA, US",
        },
        "job_preferences": {"locations": ["San Francisco, CA"]},
    }


@pytest.fixture
def no_citizenship_profile():
    """Profile with location but no explicit citizenship fields."""
    return {
        "email": "infer@example.com",
        "profile": {
            "first_name": "Priya",
            "last_name": "Sharma",
            "phone": "403-555-1234",
            "location": "Calgary, AB",
        },
        "job_preferences": {"locations": ["Calgary, AB"]},
    }


def _field(meaning, field_type="text", options=None):
    """Helper to create a FormField with a detected_meaning."""
    return FormField(
        detected_meaning=meaning,
        field_type=field_type,
        label=meaning,
        options=options,
    )


_EMPTY_DOCS = {"resume_b64": None, "cover_letter_text": None}
_JOB = {"title": "Software Engineer", "company": "TestCo"}


# ── Helper unit tests ─────────────────────────────────────────────

class TestNormalizePhone:
    def test_strips_dashes(self):
        assert _normalize_phone("403-973-3139") == "4039733139"

    def test_preserves_leading_plus(self):
        assert _normalize_phone("+1-555-867-5309") == "+15558675309"

    def test_strips_parens_and_spaces(self):
        assert _normalize_phone("(415) 555-0123") == "4155550123"

    def test_empty_string(self):
        assert _normalize_phone("") == ""

    def test_already_digits(self):
        assert _normalize_phone("4039733139") == "4039733139"


class TestInferCountryFromRegion:
    def test_alberta(self):
        assert _infer_country_from_region("AB") == "Canada"

    def test_ontario(self):
        assert _infer_country_from_region("ON") == "Canada"

    def test_california(self):
        assert _infer_country_from_region("CA") == "United States"

    def test_new_york(self):
        assert _infer_country_from_region("NY") == "United States"

    def test_dc(self):
        assert _infer_country_from_region("DC") == "United States"

    def test_unknown(self):
        assert _infer_country_from_region("XX") is None

    def test_case_insensitive(self):
        assert _infer_country_from_region("ab") == "Canada"
        assert _infer_country_from_region("ca") == "United States"


# ── Name splitting tests ──────────────────────────────────────────

class TestNameSplitting:
    def test_first_name_direct(self, canadian_profile):
        result = map_field(_field("first_name"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Test"
        assert result.source == "profile"

    def test_last_name_direct(self, canadian_profile):
        result = map_field(_field("last_name"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "User"
        assert result.source == "profile"

    def test_first_name_from_display_name(self, display_name_only_profile):
        result = map_field(_field("first_name"), display_name_only_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Jane"
        assert result.source == "profile"

    def test_last_name_from_display_name(self, display_name_only_profile):
        result = map_field(_field("last_name"), display_name_only_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Doe-Smith"
        assert result.source == "profile"

    def test_full_name_from_parts(self, canadian_profile):
        result = map_field(_field("full_name"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Test User"

    def test_full_name_from_display_name(self, display_name_only_profile):
        result = map_field(_field("full_name"), display_name_only_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Jane Doe-Smith"


# ── Work authorization tests ──────────────────────────────────────

class TestWorkAuth:
    def test_canada_citizen_yes(self, canadian_profile):
        result = map_field(_field("work_auth_canada"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Yes"

    def test_canada_citizen_us_no(self, canadian_profile):
        result = map_field(_field("work_auth_us"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "No"

    def test_us_citizen_yes(self, us_profile):
        result = map_field(_field("work_auth_us"), us_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Yes"

    def test_us_citizen_canada_no(self, us_profile):
        result = map_field(_field("work_auth_canada"), us_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "No"

    def test_inferred_canada_from_location(self, no_citizenship_profile):
        """No citizenship set, but location is Calgary, AB — infer Canada."""
        result = map_field(_field("work_auth_canada"), no_citizenship_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Yes"

    def test_inferred_us_not_from_canada_location(self, no_citizenship_profile):
        """Location is Calgary — should NOT infer US auth."""
        result = map_field(_field("work_auth_us"), no_citizenship_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "No"

    def test_with_options(self, canadian_profile):
        field = _field("work_auth_canada", field_type="select", options=["Yes", "No"])
        result = map_field(field, canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Yes"
        assert result.confidence >= 0.70

    def test_requires_sponsorship_citizen(self, canadian_profile):
        result = map_field(_field("requires_sponsorship"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "No"

    def test_requires_sponsorship_no_data(self):
        """Empty profile with no location — defaults to Yes (needs sponsorship)."""
        empty = {"email": "x@y.com", "profile": {}, "job_preferences": {}}
        result = map_field(_field("requires_sponsorship"), empty, _JOB, _EMPTY_DOCS)
        assert result.value == "Yes"

    def test_requires_sponsorship_inferred_from_location(self, no_citizenship_profile):
        result = map_field(_field("requires_sponsorship"), no_citizenship_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "No"


# ── Location tests ────────────────────────────────────────────────

class TestLocation:
    def test_city(self, canadian_profile):
        result = map_field(_field("location_city"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Calgary"

    def test_state(self, canadian_profile):
        result = map_field(_field("location_state"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "AB"

    def test_country_inferred_from_province(self, canadian_profile):
        """Calgary, AB — only 2 parts, should infer Canada from AB."""
        result = map_field(_field("location_country"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "Canada"

    def test_country_explicit_three_parts(self, us_profile):
        """San Francisco, CA, US — 3 parts, takes last directly."""
        result = map_field(_field("location_country"), us_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "US"

    def test_country_inferred_from_state(self):
        profile = {"profile": {"location": "New York, NY"}}
        result = map_field(_field("location_country"), profile, _JOB, _EMPTY_DOCS)
        assert result.value == "United States"


# ── Phone tests ───────────────────────────────────────────────────

class TestPhone:
    def test_phone_normalized(self, canadian_profile):
        result = map_field(_field("phone"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "4039733139"

    def test_phone_with_country_code(self, display_name_only_profile):
        result = map_field(_field("phone"), display_name_only_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "+15558675309"


# ── Email test ────────────────────────────────────────────────────

class TestEmail:
    def test_email(self, canadian_profile):
        result = map_field(_field("email"), canadian_profile, _JOB, _EMPTY_DOCS)
        assert result.value == "test@example.com"
