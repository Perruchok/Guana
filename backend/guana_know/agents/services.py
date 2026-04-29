"""
Service functions for the agents app.

promote_draft_to_event: promotes an EventDraft to a published Event(status=draft).
"""

import logging

logger = logging.getLogger(__name__)


def promote_draft_to_event(draft):
    """
    Promotes an EventDraft to a real Event(status=draft, source=agent).

    On success:
      - Creates the Event row (via orchestrator._create_agent_event).
      - Sets draft.resolved_event to the new event.
      - Sets draft.status = 'approved'.
      - Saves the draft.

    Returns the created Event on success, or None if promotion fails
    (e.g. missing required fields, venue not found).
    """
    from agents.orchestrator import _create_agent_event
    from guana_know.events.models import Event

    source_url = draft.source.url if draft.source else ''
    event_data = draft.parsed_data or {}

    # Count existing events before to detect the newly created one.
    # _create_agent_event only logs warnings and returns None on failure.
    existing_ids = set(
        Event.objects.filter(source='agent', source_url=source_url)
        .values_list('id', flat=True)
    )

    _create_agent_event(event_data, source_url)

    new_event = (
        Event.objects.filter(source='agent', source_url=source_url)
        .exclude(id__in=existing_ids)
        .first()
    )

    if new_event:
        draft.resolved_event = new_event
        draft.status = 'approved'
        draft.save(update_fields=['resolved_event', 'status'])
        logger.info('promote_draft_to_event: promoted draft %s → event %s', draft.id, new_event.id)
    else:
        logger.warning(
            'promote_draft_to_event: _create_agent_event did not create an event for draft %s. '
            'Missing required fields (title, start_datetime, or venue)?',
            draft.id,
        )

    return new_event
