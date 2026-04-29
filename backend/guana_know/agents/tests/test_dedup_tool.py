"""
Tests for agents/tools/dedup_tool.py

Uses the Django test database — no external services required.
"""

import pytest
from django.utils import timezone

from agents.tools import dedup_tool
from guana_know.events.tests.factories import EventFactory


@pytest.mark.django_db
class TestDedupTool:
    def test_no_duplicate_when_db_empty(self):
        result = dedup_tool.run(title="Concierto de Jazz")
        assert result["is_duplicate"] is False
        assert result["existing_event_id"] is None

    def test_detects_exact_title_match(self, db):
        EventFactory(title="Concierto de Jazz", status="published")
        result = dedup_tool.run(title="Concierto de Jazz")
        assert result["is_duplicate"] is True
        assert result["existing_event_id"] is not None

    def test_detects_case_insensitive_title_match(self, db):
        EventFactory(title="concierto de jazz", status="published")
        result = dedup_tool.run(title="CONCIERTO DE JAZZ")
        assert result["is_duplicate"] is True

    def test_no_duplicate_on_different_title(self, db):
        EventFactory(title="Exposición de Arte", status="published")
        result = dedup_tool.run(title="Concierto de Jazz")
        assert result["is_duplicate"] is False

    def test_filters_by_venue_name_when_provided(self, db):
        from guana_know.venues.tests.factories import VenueFactory

        venue_a = VenueFactory(name="Teatro Juárez")
        venue_b = VenueFactory(name="Museo Iconográfico")

        EventFactory(title="Concierto de Jazz", venue=venue_a, status="published")

        # Same title, different venue → not a duplicate
        result = dedup_tool.run(title="Concierto de Jazz", venue_name="Museo Iconográfico")
        assert result["is_duplicate"] is False

        # Same title, same venue → duplicate
        result = dedup_tool.run(title="Concierto de Jazz", venue_name="Teatro Juárez")
        assert result["is_duplicate"] is True

    def test_detects_duplicate_within_datetime_tolerance(self, db):
        dt = timezone.now() + timezone.timedelta(days=5)
        EventFactory(title="Festival de Cine", status="published", start_datetime=dt)

        # One hour off → within 3-hour tolerance → duplicate
        nearby_dt = (dt + timezone.timedelta(hours=1)).isoformat()
        result = dedup_tool.run(title="Festival de Cine", start_datetime=nearby_dt)
        assert result["is_duplicate"] is True

    def test_no_duplicate_outside_datetime_tolerance(self, db):
        dt = timezone.now() + timezone.timedelta(days=5)
        EventFactory(title="Festival de Cine", status="published", start_datetime=dt)

        # 4 hours off → outside 3-hour tolerance → not a duplicate
        far_dt = (dt + timezone.timedelta(hours=4)).isoformat()
        result = dedup_tool.run(title="Festival de Cine", start_datetime=far_dt)
        assert result["is_duplicate"] is False

    def test_handles_null_start_datetime(self, db):
        EventFactory(title="Concierto de Jazz", status="published")
        # No start_datetime provided — should still detect by title
        result = dedup_tool.run(title="Concierto de Jazz", start_datetime=None)
        assert result["is_duplicate"] is True

    def test_returns_existing_event_id_as_string(self, db):
        event = EventFactory(title="Obra de Teatro", status="published")
        result = dedup_tool.run(title="Obra de Teatro")
        assert result["existing_event_id"] == str(event.id)
