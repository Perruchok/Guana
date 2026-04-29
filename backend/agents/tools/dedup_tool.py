"""
dedup_tool — checks if an event already exists in the database.

Queries PostgreSQL (via Django ORM) to detect duplicate events based on
title + venue name + start datetime proximity.

Must be called from within the Django environment (DJANGO_SETTINGS_MODULE set).
"""

import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

TOOL_DEFINITION = {
    'type': 'function',
    'function': {
        'name': 'dedup_tool',
        'description': (
            'Checks whether an event with the given title, venue, and start datetime '
            'already exists in the database.'
        ),
        'parameters': {
            'type': 'object',
            'properties': {
                'title': {
                    'type': 'string',
                    'description': 'Title of the candidate event.',
                },
                'venue_name': {
                    'type': 'string',
                    'description': 'Name of the venue (may be null).',
                },
                'start_datetime': {
                    'type': 'string',
                    'description': 'ISO 8601 start datetime (may be null).',
                },
            },
            'required': ['title'],
        },
    }
}

_DATETIME_TOLERANCE_HOURS = 3


def run(title: str, venue_name: str | None = None, start_datetime: str | None = None) -> dict:
    """
    Checks whether an event already exists in the database.

    Args:
        title: Title of the candidate event.
        venue_name: Optional venue name.
        start_datetime: Optional ISO 8601 start datetime string.

    Returns:
        A dict with 'is_duplicate' (bool) and optionally 'existing_event_id' (str).
    """
    from django.db.models import Q
    from guana_know.events.models import Event

    title_normalized = title.strip().lower()

    qs = Event.objects.filter(title__iexact=title_normalized)

    if not qs.exists():
        qs = Event.objects.filter(title__icontains=title_normalized[:40])

    if venue_name:
        qs = qs.filter(venue__name__iexact=venue_name.strip())

    if start_datetime:
        from django.utils.dateparse import parse_datetime
        from django.utils import timezone

        dt = parse_datetime(start_datetime)
        if dt:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            tolerance = timedelta(hours=_DATETIME_TOLERANCE_HOURS)
            qs = qs.filter(
                start_datetime__gte=dt - tolerance,
                start_datetime__lte=dt + tolerance,
            )

    existing = qs.first()
    if existing:
        return {'is_duplicate': True, 'existing_event_id': str(existing.id)}

    return {'is_duplicate': False, 'existing_event_id': None}
