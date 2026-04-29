"""
Tests for agents/tools/parse_tool.py

All Azure OpenAI API calls are mocked — no real API key required.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from agents.tools import parse_tool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_openai_response(json_payload: dict) -> MagicMock:
    """Build a minimal mock of an Azure OpenAI ChatCompletion response."""
    message = MagicMock()
    message.content = json.dumps(json_payload)

    choice = MagicMock()
    choice.message = message

    response = MagicMock()
    response.choices = [choice]
    return response


VALID_EVENTS_PAYLOAD = {
    "events": [
        {
            "title": "Exposición colectiva de pintura",
            "description": "Una exposición de pintores guanajuatenses.",
            "start_datetime": "2026-05-01T18:00:00",
            "end_datetime": "2026-05-01T21:00:00",
            "venue_name": "Museo Iconográfico del Quijote",
            "category": "exhibition",
            "price": 0,
            "is_free": True,
            "registration_url": None,
            "confidence": 0.92,
            "issues": [],
        }
    ]
}

MISSING_DATE_PAYLOAD = {
    "events": [
        {
            "title": "Concierto de jazz",
            "description": None,
            "start_datetime": None,
            "end_datetime": None,
            "venue_name": "Teatro Juárez",
            "category": "music",
            "price": 100,
            "is_free": False,
            "registration_url": None,
            "confidence": 0.45,
            "issues": ["missing_date"],
        }
    ]
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestParseTool:
    @patch.dict("os.environ", {"AZURE_OPENAI_API_KEY": "test-key", "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/"})
    @patch("agents.tools.parse_tool.AzureOpenAI")
    def test_returns_events_on_valid_response(self, MockAzureOpenAI):
        client = MockAzureOpenAI.return_value
        client.chat.completions.create.return_value = _make_openai_response(VALID_EVENTS_PAYLOAD)

        result = parse_tool.run(
            content="Exposición colectiva de pintura el 1 de mayo...",
            source_url="https://example.com/events",
            source_type="website",
        )

        assert "events" in result
        assert len(result["events"]) == 1
        event = result["events"][0]
        assert event["title"] == "Exposición colectiva de pintura"
        assert event["confidence"] == 0.92
        assert event["issues"] == []

    @patch.dict("os.environ", {"AZURE_OPENAI_API_KEY": "test-key", "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/"})
    @patch("agents.tools.parse_tool.AzureOpenAI")
    def test_returns_events_with_missing_date_issues(self, MockAzureOpenAI):
        client = MockAzureOpenAI.return_value
        client.chat.completions.create.return_value = _make_openai_response(MISSING_DATE_PAYLOAD)

        result = parse_tool.run(
            content="Concierto de jazz en el Teatro Juárez...",
            source_url="https://example.com/events",
            source_type="website",
        )

        assert len(result["events"]) == 1
        event = result["events"][0]
        assert "missing_date" in event["issues"]
        assert event["start_datetime"] is None

    @patch.dict("os.environ", {"AZURE_OPENAI_API_KEY": "test-key", "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/"})
    @patch("agents.tools.parse_tool.AzureOpenAI")
    def test_returns_error_on_invalid_json_response(self, MockAzureOpenAI):
        message = MagicMock()
        message.content = "This is not JSON at all."
        choice = MagicMock()
        choice.message = message
        response = MagicMock()
        response.choices = [choice]
        client = MockAzureOpenAI.return_value
        client.chat.completions.create.return_value = response

        result = parse_tool.run(
            content="some content",
            source_url="https://example.com",
            source_type="website",
        )

        assert "error" in result
        assert result.get("events", []) == []

    @patch.dict("os.environ", {}, clear=True)
    def test_returns_error_when_api_key_missing(self):
        result = parse_tool.run(
            content="some content",
            source_url="https://example.com",
            source_type="website",
        )

        assert "error" in result
        assert result["events"] == []

    @patch.dict("os.environ", {"AZURE_OPENAI_API_KEY": "test-key", "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/"})
    @patch("agents.tools.parse_tool.AzureOpenAI")
    def test_returns_empty_events_list_on_api_error(self, MockAzureOpenAI):
        client = MockAzureOpenAI.return_value
        client.chat.completions.create.side_effect = Exception("rate limit exceeded")

        result = parse_tool.run(
            content="some content",
            source_url="https://example.com",
            source_type="website",
        )

        assert "error" in result
        assert result["events"] == []

    @patch.dict("os.environ", {"AZURE_OPENAI_API_KEY": "test-key", "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/"})
    @patch("agents.tools.parse_tool.AzureOpenAI")
    def test_passes_source_url_and_type_in_message(self, MockAzureOpenAI):
        client = MockAzureOpenAI.return_value
        client.chat.completions.create.return_value = _make_openai_response({"events": []})

        parse_tool.run(
            content="some content",
            source_url="https://target.com/eventos",
            source_type="instagram",
        )

        call_kwargs = client.chat.completions.create.call_args
        messages = call_kwargs.kwargs["messages"]
        user_message = next(m["content"] for m in messages if m["role"] == "user")
        assert "https://target.com/eventos" in user_message
        assert "instagram" in user_message

