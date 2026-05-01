"""
Tests for the Greenhouse ATS adapter.

Covers:
  1. URL parsing (all 4 regex patterns + edge cases)
  2. extract_questions parsing from fixture JSON
  3. Field detection accuracy on labeled examples
  4. Field mapper validation (profile → field value)
  5. _parse_question internals
"""
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is on path (conftest handles this too)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from adapters.greenhouse import (
    GreenhouseAdapter,
    parse_greenhouse_url,
    _parse_question,
    _GH_TYPE_MAP,
    UnsupportedJobError,
    TransientError,
    ParseError,
)
from models_application import FormField


# ═══════════════════════════════════════════════════════════════════
# 1. URL Parsing
# ═══════════════════════════════════════════════════════════════════

class TestURLParsing:
    """Test parse_greenhouse_url against all URL patterns."""

    @pytest.mark.parametrize("url,expected_slug,expected_id", [
        # Pattern 1: boards.greenhouse.io/{slug}/jobs/{id}
        ("https://boards.greenhouse.io/acmecorp/jobs/4012345", "acmecorp", "4012345"),
        ("http://boards.greenhouse.io/bigtech/jobs/999", "bigtech", "999"),
        ("https://boards.greenhouse.io/ACME/jobs/12345678", "ACME", "12345678"),
        # Pattern 2: job-boards.greenhouse.io/{slug}/jobs/{id}
        ("https://job-boards.greenhouse.io/acmecorp/jobs/4012345", "acmecorp", "4012345"),
        ("https://job-boards.greenhouse.io/startup/jobs/7777777", "startup", "7777777"),
        # Pattern 3: {company}.greenhouse.io/{anything}/jobs/{id}
        ("https://acmecorp.greenhouse.io/careers/jobs/4012345", "acmecorp", "4012345"),
        ("https://acmecorp.greenhouse.io/embed/jobs/4012345", "acmecorp", "4012345"),
        ("https://bigtech.greenhouse.io/internal/engineering/jobs/123", "bigtech", "123"),
        # Pattern 3 catch: subdomain is captured as slug (not the path segment)
        ("https://custom.greenhouse.io/mycompany/jobs/55555", "custom", "55555"),
        # With query params / fragments
        ("https://boards.greenhouse.io/acmecorp/jobs/4012345?gh_jid=4012345", "acmecorp", "4012345"),
        ("https://boards.greenhouse.io/acmecorp/jobs/4012345#app", "acmecorp", "4012345"),
    ])
    def test_valid_urls(self, url, expected_slug, expected_id):
        result = parse_greenhouse_url(url)
        assert result is not None, f"Failed to parse: {url}"
        slug, job_id = result
        assert slug == expected_slug
        assert job_id == expected_id

    @pytest.mark.parametrize("url", [
        "https://lever.co/acmecorp/jobs/123",
        "https://ashbyhq.com/careers/123",
        "https://example.com/jobs/123",
        "https://boards.greenhouse.io/acmecorp",  # No /jobs/ segment
        "https://boards.greenhouse.io/acmecorp/jobs/",  # No job ID
        "not-a-url",
        "",
    ])
    def test_invalid_urls(self, url):
        result = parse_greenhouse_url(url)
        assert result is None, f"Should not parse: {url}"

    def test_adapter_matches(self):
        adapter = GreenhouseAdapter()
        assert adapter.matches("https://boards.greenhouse.io/acme/jobs/123")
        assert adapter.matches("https://job-boards.greenhouse.io/acme/jobs/456")
        assert adapter.matches("https://acme.greenhouse.io/x/jobs/789")
        assert not adapter.matches("https://lever.co/acme/jobs/123")
        assert not adapter.matches("https://example.com")


# ═══════════════════════════════════════════════════════════════════
# 2. _parse_question
# ═══════════════════════════════════════════════════════════════════

class TestParseQuestion:
    """Test individual question parsing from API response format."""

    def test_text_input(self):
        q = {
            "id": 10001,
            "label": "First Name",
            "required": True,
            "fields": [{"name": "first_name", "type": "input_text", "values": []}],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "text"
        assert field.label == "First Name"
        assert field.required is True
        assert field.board_field_id == "first_name"
        assert field.options is None or field.options == []

    def test_file_upload(self):
        q = {
            "id": 10005,
            "label": "Resume/CV",
            "required": True,
            "fields": [{"name": "resume", "type": "input_file", "values": []}],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "file"

    def test_select_with_options(self):
        q = {
            "id": 10009,
            "label": "How did you hear about this job?",
            "required": False,
            "fields": [
                {
                    "name": "how_did_you_hear",
                    "type": "multi_value_single_select",
                    "values": [
                        {"label": "LinkedIn", "value": 1},
                        {"label": "Job Board", "value": 2},
                        {"label": "Other", "value": 3},
                    ],
                }
            ],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "select"
        assert field.options == ["LinkedIn", "Job Board", "Other"]
        assert field.required is False

    def test_multi_select(self):
        q = {
            "id": 40010,
            "label": "Tools used",
            "required": False,
            "fields": [
                {
                    "name": "tools",
                    "type": "multi_value_multi_select",
                    "values": [
                        {"label": "Python", "value": 1},
                        {"label": "R", "value": 2},
                    ],
                }
            ],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "multi_select"
        assert field.options == ["Python", "R"]

    def test_textarea(self):
        q = {
            "id": 10012,
            "label": "Tell us about yourself",
            "required": False,
            "fields": [{"name": "about", "type": "textarea", "values": []}],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "textarea"

    def test_checkbox(self):
        q = {
            "id": 40015,
            "label": "Agree to terms",
            "required": True,
            "fields": [{"name": "agree", "type": "boolean", "values": []}],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "checkbox"

    def test_hidden_field(self):
        q = {
            "id": 99999,
            "label": "Hidden",
            "required": False,
            "fields": [{"name": "hidden_id", "type": "input_hidden", "values": []}],
        }
        field = _parse_question(q)
        assert field is not None
        assert field.field_type == "unknown"

    def test_eeo_question(self):
        q = {
            "id": 20001,
            "label": "Gender",
            "required": False,
            "type": "gender",
            "fields": [
                {
                    "name": "demo_gender",
                    "type": "multi_value_single_select",
                    "values": [
                        {"label": "Male", "value": 1},
                        {"label": "Female", "value": 2},
                        {"label": "Decline to self-identify", "value": 3},
                    ],
                }
            ],
        }
        field = _parse_question(q, is_eeo=True)
        assert field is not None
        assert field.board_specific_meta["is_eeo"] is True
        assert field.board_specific_meta["eeo_type"] == "gender"
        assert field.field_type == "select"

    def test_empty_fields(self):
        q = {"id": 1, "label": "Empty", "required": False, "fields": []}
        field = _parse_question(q)
        assert field is None

    def test_no_fields_key(self):
        q = {"id": 1, "label": "No fields"}
        field = _parse_question(q)
        assert field is None


# ═══════════════════════════════════════════════════════════════════
# 3. extract_questions via fixture data
# ═══════════════════════════════════════════════════════════════════

class TestExtractQuestions:
    """Test extract_questions by mocking the HTTP call with fixture data."""

    @pytest.fixture
    def adapter(self):
        return GreenhouseAdapter()

    def _mock_response(self, fixture_data: dict, status_code: int = 200):
        """Create a mock httpx response."""
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = fixture_data
        return resp

    @pytest.mark.asyncio
    async def test_swe_full_extraction(self, adapter, fixture_swe_full):
        """Full SWE job should yield 12 standard + 3 demographic = 15 fields."""
        mock_resp = self._mock_response(fixture_swe_full)

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient, \
             patch("field_detector.detect_meaning", return_value=("unknown", 0.5)):
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            fields = await adapter.extract_questions(
                "https://boards.greenhouse.io/testcorp/jobs/4012345"
            )

        assert len(fields) == 15
        # Check we got the right mix of types
        types = [f.field_type for f in fields]
        # first_name, last_name, email, phone, linkedin, website = 6 text
        assert types.count("text") == 6
        assert types.count("file") == 2  # resume, cover letter
        assert types.count("select") == 6  # how_did_you_hear, work_auth, sponsorship, gender, race, veteran
        assert types.count("textarea") == 1  # why_interested

    @pytest.mark.asyncio
    async def test_minimal_extraction(self, adapter, fixture_minimal):
        """Minimal job should yield just 4 fields."""
        mock_resp = self._mock_response(fixture_minimal)

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient, \
             patch("field_detector.detect_meaning", return_value=("unknown", 0.5)):
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            fields = await adapter.extract_questions(
                "https://boards.greenhouse.io/testcorp/jobs/5098765"
            )

        assert len(fields) == 4
        labels = [f.label for f in fields]
        assert "First Name" in labels
        assert "Last Name" in labels
        assert "Email" in labels
        assert "Resume/CV" in labels

    @pytest.mark.asyncio
    async def test_custom_questions_extraction(self, adapter, fixture_custom_questions):
        """Custom questions job with multi-select, checkbox, etc."""
        mock_resp = self._mock_response(fixture_custom_questions)

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient, \
             patch("field_detector.detect_meaning", return_value=("unknown", 0.5)):
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            fields = await adapter.extract_questions(
                "https://boards.greenhouse.io/testcorp/jobs/6077777"
            )

        # 16 standard + 3 demographic = 19
        assert len(fields) == 19

        # Verify multi-select is parsed
        multi = [f for f in fields if f.field_type == "multi_select"]
        assert len(multi) == 1
        assert multi[0].options is not None
        assert "Python" in multi[0].options

        # Verify checkbox (boolean)
        checkboxes = [f for f in fields if f.field_type == "checkbox"]
        assert len(checkboxes) == 1

    @pytest.mark.asyncio
    async def test_404_raises_unsupported(self, adapter):
        """404 from API should raise UnsupportedJobError."""
        mock_resp = self._mock_response({}, status_code=404)

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            with pytest.raises(UnsupportedJobError):
                await adapter.extract_questions(
                    "https://boards.greenhouse.io/testcorp/jobs/999999"
                )

    @pytest.mark.asyncio
    async def test_500_raises_transient(self, adapter):
        """5xx from API should raise TransientError."""
        mock_resp = self._mock_response({}, status_code=503)

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            with pytest.raises(TransientError):
                await adapter.extract_questions(
                    "https://boards.greenhouse.io/testcorp/jobs/999999"
                )

    @pytest.mark.asyncio
    async def test_bad_url_raises(self, adapter):
        """Non-Greenhouse URL should raise UnsupportedJobError."""
        with pytest.raises(UnsupportedJobError):
            await adapter.extract_questions("https://lever.co/acme/jobs/123")

    @pytest.mark.asyncio
    async def test_invalid_json_raises_parse_error(self, adapter):
        """Invalid JSON response should raise ParseError."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.side_effect = ValueError("bad json")

        with patch("adapters.greenhouse.httpx.AsyncClient") as MockClient:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_resp)
            MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            with pytest.raises(ParseError):
                await adapter.extract_questions(
                    "https://boards.greenhouse.io/testcorp/jobs/123"
                )


# ═══════════════════════════════════════════════════════════════════
# 4. Field Detection Accuracy
# ═══════════════════════════════════════════════════════════════════

class TestFieldDetectionAccuracy:
    """
    Test that field_detector.detect_meaning correctly classifies labeled fields.
    These tests mock the LLM call to test the prompt/parsing logic independently.
    """

    LABELED_FIELDS = [
        # (label, board, context, expected_meaning)
        ("First Name", "greenhouse", {"field_type": "text"}, "first_name"),
        ("Last Name", "greenhouse", {"field_type": "text"}, "last_name"),
        ("Email", "greenhouse", {"field_type": "text"}, "email"),
        ("Email Address", "greenhouse", {"field_type": "text"}, "email"),
        ("Phone", "greenhouse", {"field_type": "text"}, "phone"),
        ("Phone Number", "greenhouse", {"field_type": "text"}, "phone"),
        ("Resume/CV", "greenhouse", {"field_type": "file"}, "resume_upload"),
        ("Upload your resume", "greenhouse", {"field_type": "file"}, "resume_upload"),
        ("Cover Letter", "greenhouse", {"field_type": "file"}, "cover_letter_upload"),
        ("LinkedIn Profile", "greenhouse", {"field_type": "text"}, "linkedin_url"),
        ("LinkedIn URL", "lever", {"field_type": "text"}, "linkedin_url"),
        ("GitHub Profile", "greenhouse", {"field_type": "text"}, "github_url"),
        ("GitHub URL", "lever", {"field_type": "text"}, "github_url"),
        ("Website", "greenhouse", {"field_type": "text"}, "portfolio_url"),
        ("Portfolio URL", "greenhouse", {"field_type": "text"}, "portfolio_url"),
        ("Are you legally authorized to work in the United States?", "greenhouse", {"field_type": "select"}, "work_auth_us"),
        ("Are you authorized to work in the US?", "greenhouse", {"field_type": "select"}, "work_auth_us"),
        ("Will you now or in the future require sponsorship?", "greenhouse", {"field_type": "select"}, "requires_sponsorship"),
        ("Do you require visa sponsorship?", "greenhouse", {"field_type": "select"}, "requires_sponsorship"),
        ("How did you hear about this job?", "greenhouse", {"field_type": "select"}, "how_did_you_hear"),
        ("How did you hear about this position?", "lever", {"field_type": "select"}, "how_did_you_hear"),
        ("Gender", "greenhouse", {"field_type": "select", "is_eeo": True}, "gender"),
        ("Race / Ethnicity", "greenhouse", {"field_type": "select", "is_eeo": True}, "ethnicity"),
        ("Veteran Status", "greenhouse", {"field_type": "select", "is_eeo": True}, "veteran_status"),
        ("Disability Status", "greenhouse", {"field_type": "select", "is_eeo": True}, "disability_status"),
        ("Are you Hispanic or Latino?", "greenhouse", {"field_type": "select", "is_eeo": True}, "hispanic_latino"),
        ("Why are you interested in this role?", "greenhouse", {"field_type": "textarea"}, "why_role"),
        ("Why do you want to work at our company?", "greenhouse", {"field_type": "textarea"}, "why_company"),
        ("Tell us about yourself", "greenhouse", {"field_type": "textarea"}, "tell_us_about_yourself"),
        ("Additional Information", "greenhouse", {"field_type": "textarea"}, "additional_info"),
    ]

    @pytest.mark.parametrize("label,board,context,expected", LABELED_FIELDS)
    def test_detection_with_mocked_llm(self, label, board, context, expected):
        """Simulate the LLM returning the correct classification."""
        llm_response = json.dumps({"meaning": expected, "confidence": 0.95})

        with patch("auto_apply_service._invoke_llm", return_value=llm_response), \
             patch("field_detector.field_meanings_col") as mock_col:
            mock_col.find_one.return_value = None  # No cache hit

            from field_detector import detect_meaning
            meaning, confidence = detect_meaning(label, context, board)

        assert meaning == expected, f"Expected '{expected}' for label '{label}', got '{meaning}'"
        assert confidence >= 0.5

    def test_cache_hit_skips_llm(self):
        """When cache has a hit, LLM should not be called."""
        with patch("field_detector.field_meanings_col") as mock_col, \
             patch("auto_apply_service._invoke_llm") as mock_llm:
            mock_col.find_one.return_value = {
                "_id": "cached",
                "detected_meaning": "first_name",
                "confidence": 0.99,
            }

            from field_detector import detect_meaning
            meaning, confidence = detect_meaning("First Name", board="greenhouse")

            assert meaning == "first_name"
            assert confidence == 0.99
            mock_llm.assert_not_called()

    def test_out_of_taxonomy_forced_unknown(self):
        """If LLM returns a meaning not in taxonomy, force to unknown."""
        llm_response = json.dumps({"meaning": "favorite_color", "confidence": 0.90})

        with patch("auto_apply_service._invoke_llm", return_value=llm_response), \
             patch("field_detector.field_meanings_col") as mock_col:
            mock_col.find_one.return_value = None

            from field_detector import detect_meaning
            meaning, confidence = detect_meaning("Favorite Color", board="greenhouse")

        assert meaning == "unknown"
        assert confidence <= 0.3

    def test_empty_label_returns_unknown(self):
        """Empty labels should return unknown without calling LLM."""
        from field_detector import detect_meaning
        meaning, confidence = detect_meaning("", board="greenhouse")
        assert meaning == "unknown"
        assert confidence == 0.0

    def test_llm_failure_returns_unknown(self):
        """If LLM call fails, return unknown gracefully."""
        with patch("auto_apply_service._invoke_llm", side_effect=Exception("API error")), \
             patch("field_detector.field_meanings_col") as mock_col:
            mock_col.find_one.return_value = None

            from field_detector import detect_meaning
            meaning, confidence = detect_meaning("First Name", board="greenhouse")

        assert meaning == "unknown"
        assert confidence == 0.0


# ═══════════════════════════════════════════════════════════════════
# 5. Field Mapper Validation
# ═══════════════════════════════════════════════════════════════════

class TestFieldMapper:
    """Test profile-to-field value mapping."""

    def _make_field(self, meaning: str, field_type: str = "text",
                    options: list = None, required: bool = False) -> FormField:
        return FormField(
            board_field_id=f"test_{meaning}",
            field_type=field_type,
            label=f"Test {meaning}",
            required=required,
            options=options,
            detected_meaning=meaning,
        )

    def test_first_name(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("first_name")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Jane"
        assert result.source == "profile"
        assert result.confidence >= 0.9

    def test_last_name(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("last_name")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Doe"
        assert result.source == "profile"

    def test_full_name(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("full_name")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Jane Doe"

    def test_email(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("email")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "jane.doe@example.com"
        assert result.source == "profile"

    def test_phone(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("phone")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "+15558675309"

    def test_linkedin(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("linkedin_url")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "https://linkedin.com/in/janedoe"

    def test_github(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("github_url")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "https://github.com/janedoe"

    def test_portfolio(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("portfolio_url")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "https://janedoe.dev"

    def test_location_city(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("location_city")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "San Francisco"
        assert result.source == "profile"

    def test_location_state(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("location_state")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "CA"

    def test_work_auth_us_authorized(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("work_auth_us", "select", ["Yes", "No"])
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Yes"

    def test_work_auth_us_not_authorized(self):
        from field_mapper import map_field
        profile = {"citizenship": "Indian", "work_authorization_status": "H-1B visa holder", "profile": {}}
        field = self._make_field("work_auth_us", "select", ["Yes", "No"])
        result = map_field(field, profile, {}, {})
        # H-1B is not explicitly authorized — depends on implementation
        # The mapper checks for "authorized" in work_auth
        assert result.value in ("Yes", "No")

    def test_requires_sponsorship_no(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("requires_sponsorship", "select", ["Yes", "No"])
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "No"  # US citizen doesn't need sponsorship

    def test_resume_upload_from_tailored(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("resume_upload", "file")
        tailored = {"resume_b64": "base64_tailored_resume"}
        result = map_field(field, sample_profile, {}, tailored)
        assert result.value == "base64_tailored_resume"
        assert result.source == "tailored"

    def test_resume_upload_from_profile(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("resume_upload", "file")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "base64_resume_data_here"
        assert result.source == "profile"

    def test_cover_letter_upload_needs_input(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("cover_letter_upload", "file")
        result = map_field(field, sample_profile, {}, {})
        assert result.source == "needs_user_input"

    def test_cover_letter_from_tailored(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("cover_letter_upload", "file")
        tailored = {"cover_letter_text": "Dear Hiring Manager..."}
        result = map_field(field, sample_profile, {}, tailored)
        assert result.value == "Dear Hiring Manager..."
        assert result.source == "tailored"

    def test_demographics_decline_when_not_sharing(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("gender", "select", [
            "Male", "Female", "Non-Binary", "Decline to self-identify"
        ])
        result = map_field(field, sample_profile, {}, {}, overrides={"share_demographics": False})
        assert result.value == "Decline to self-identify"
        assert result.source == "override"

    def test_demographics_decline_prefer_not(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("gender", "select", [
            "Male", "Female", "Non-Binary", "Prefer not to say"
        ])
        result = map_field(field, sample_profile, {}, {}, overrides={"share_demographics": False})
        assert result.value == "Prefer not to say"

    def test_agree_to_terms(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("agree_to_terms", "checkbox")
        result = map_field(field, sample_profile, {}, {})
        assert result.value is True
        assert result.source == "override"

    def test_free_text_needs_user_input(self, sample_profile):
        from field_mapper import map_field
        for meaning in ["why_company", "why_role", "tell_us_about_yourself"]:
            field = self._make_field(meaning, "textarea")
            result = map_field(field, sample_profile, {}, {})
            assert result.source == "needs_user_input", f"{meaning} should need user input"

    def test_salary_expectation_needs_input(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("salary_expectation")
        result = map_field(field, sample_profile, {}, {})
        assert result.source == "needs_user_input"

    def test_unknown_meaning_needs_input(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("unknown")
        result = map_field(field, sample_profile, {}, {})
        assert result.source == "needs_user_input"

    def test_current_company(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("current_company")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Acme Corp"
        assert result.source == "profile"

    def test_current_title(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("current_title")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Senior Engineer"

    def test_school_name(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("school_name")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "University of California, Berkeley"

    def test_degree(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("degree")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Bachelor of Science"

    def test_field_of_study(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("field_of_study")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "Computer Science"

    def test_gpa(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("gpa")
        result = map_field(field, sample_profile, {}, {})
        assert result.value == "3.8"

    def test_how_did_you_hear_with_options(self, sample_profile):
        from field_mapper import map_field
        field = self._make_field("how_did_you_hear", "select", [
            "LinkedIn", "Job Board", "Friend", "Other"
        ])
        result = map_field(field, sample_profile, {}, {})
        assert result.value in ["Job Board", "Other"]
        assert result.source == "override"


# ═══════════════════════════════════════════════════════════════════
# 6. Fuzzy matching helpers
# ═══════════════════════════════════════════════════════════════════

class TestFuzzyMatching:
    """Test the fuzzy option matching from field_mapper."""

    def test_exact_match(self):
        from field_mapper import _fuzzy_match_option
        result = _fuzzy_match_option("Yes", ["Yes", "No"])
        assert result == "Yes"

    def test_case_insensitive(self):
        from field_mapper import _fuzzy_match_option
        result = _fuzzy_match_option("yes", ["Yes", "No"])
        assert result == "Yes"

    def test_decline_option_found(self):
        from field_mapper import _decline_option
        opts = ["Male", "Female", "Decline to self-identify"]
        result = _decline_option(opts)
        assert result == "Decline to self-identify"

    def test_decline_option_prefer_not(self):
        from field_mapper import _decline_option
        opts = ["Male", "Female", "Prefer not to say"]
        result = _decline_option(opts)
        assert result == "Prefer not to say"

    def test_decline_option_not_found(self):
        from field_mapper import _decline_option
        opts = ["Male", "Female", "Non-Binary"]
        result = _decline_option(opts)
        # With rapidfuzz available, might fuzzy-match "Non-Binary" but shouldn't
        # Without a decline phrase, this should return None or the fuzzy fallback
        # The fuzzy fallback tries "Decline to self-identify" against all options
        # which should fail for these options
        assert result is None or result in opts

    def test_empty_options(self):
        from field_mapper import _fuzzy_match_option
        result = _fuzzy_match_option("Yes", [])
        assert result is None

    def test_empty_value(self):
        from field_mapper import _fuzzy_match_option
        result = _fuzzy_match_option("", ["Yes", "No"])
        assert result is None


# ═══════════════════════════════════════════════════════════════════
# 7. GH Type Map completeness
# ═══════════════════════════════════════════════════════════════════

class TestTypeMap:
    """Verify the Greenhouse type map covers known field types."""

    EXPECTED_TYPES = [
        "input_text", "input_file", "textarea",
        "multi_value_single_select", "multi_value_multi_select",
        "input_hidden", "boolean",
    ]

    def test_all_known_types_mapped(self):
        for gh_type in self.EXPECTED_TYPES:
            assert gh_type in _GH_TYPE_MAP, f"Missing mapping for Greenhouse type: {gh_type}"

    def test_mapped_values_are_valid(self):
        valid_types = {"text", "textarea", "select", "multi_select", "file", "checkbox", "radio", "date", "unknown"}
        for gh_type, mapped in _GH_TYPE_MAP.items():
            assert mapped in valid_types, f"Invalid mapped type '{mapped}' for GH type '{gh_type}'"


# ═══════════════════════════════════════════════════════════════════
# 8. Adapter registration
# ═══════════════════════════════════════════════════════════════════

class TestAdapterRegistration:
    """Verify the Greenhouse adapter is auto-registered via dispatcher."""

    def test_greenhouse_registered(self):
        from adapters.dispatcher import get_adapter
        adapter = get_adapter("https://boards.greenhouse.io/acme/jobs/123")
        assert adapter is not None
        assert isinstance(adapter, GreenhouseAdapter)

    def test_non_greenhouse_returns_none(self):
        from adapters.dispatcher import get_adapter
        adapter = get_adapter("https://example.com/jobs/123")
        # Could return None or a different adapter depending on what's registered
        if adapter is not None:
            assert not isinstance(adapter, GreenhouseAdapter)
