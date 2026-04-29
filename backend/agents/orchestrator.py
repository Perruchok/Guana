"""
Discovery agent orchestrator for Guana Know.

Uses Azure OpenAI with function calling to discover events from registered
EventSource objects and save them to the database as EventDraft or Event(draft).

The orchestrator:
1. Calls scrape_tool to fetch content from a source URL.
2. Calls parse_tool to extract candidate events from the content.
3. Calls dedup_tool for each candidate to check for duplicates.
4. Writes eligible candidates to the database.

Confidence threshold:
  >= CONFIDENCE_AUTO_DRAFT  → Event(status=draft, source=agent)
  <  CONFIDENCE_AUTO_DRAFT  → EventDraft(status=pending_review)
"""

import json
import logging
import os
from datetime import datetime, timezone

from openai import AzureOpenAI

from agents.tools import dedup_tool, parse_tool, scrape_tool

logger = logging.getLogger(__name__)

CONFIDENCE_AUTO_DRAFT = 0.80

_TOOLS = [
    scrape_tool.TOOL_DEFINITION,
    parse_tool.TOOL_DEFINITION,
    dedup_tool.TOOL_DEFINITION,
]

_SYSTEM_PROMPT = """\
You are an autonomous event discovery agent for Guana Know, a cultural calendar for Guanajuato, Mexico.

Your goal: discover upcoming cultural events from a given event source URL.

Workflow:
1. Call scrape_tool with the source URL to fetch the listing page.
   The result contains: content (page text), image_url, and event_links
   (a list of URLs for individual event detail pages).

2. If event_links are present, call scrape_tool on EACH event detail URL (up to 10)
   to fetch the full event data: description, venue, schedule, and price.
   These detail pages are the authoritative source — the listing page only has titles and dates.

3. For each event detail page scraped in step 2, call parse_tool with:
   - content: the text from that individual detail page
   - source_url: the detail page URL
   - source_type: same as the original source_type
   - image_url: the image_url returned by scrape_tool for that page
   Call parse_tool once per event detail page to extract one event at a time.
   If NO event_links were returned in step 1, fall back to calling parse_tool
   on the listing page content instead.

4. For each candidate event returned by any parse_tool call, call dedup_tool
   to check if it already exists in the database.

5. Return a final JSON summary of ALL candidates found across all parse_tool calls.
   Do NOT write to the database directly — the caller handles persistence.

Final response format (return ONLY this JSON, no extra text):
{{
  "candidates": [
    {{
      "event_data": {{
        "title": "string",
        "description": "string or null",
        "start_datetime": "ISO8601 or null",
        "end_datetime": "ISO8601 or null",
        "venue_name": "string or null",
        "category": "string",
        "price": 0,
        "is_free": true,
        "registration_url": "string or null",
        "image_url": "MUST copy this exactly from the parse_tool result for this event — never null if parse_tool returned a value"
      }},
      "confidence": 0.85,
      "issues": [],
      "is_duplicate": false
    }}
  ],
  "scrape_status": 200,
  "total_found": 3,
  "total_duplicates": 1
}}

CRITICAL: Copy event_data fields verbatim from parse_tool results. Never drop image_url — if parse_tool returned an image_url for an event, it MUST appear in event_data.image_url. If parse_tool returned null or no image_url, then event_data.image_url MUST be null — NEVER substitute the source_url, page URL, or any non-image URL as image_url.

If scraping fails, return {{"candidates": [], "scrape_status": <code>, "total_found": 0, "total_duplicates": 0, "error": "reason"}}.
"""


def _dispatch_tool(tool_name: str, tool_input: dict) -> str:
    """Executes the requested tool and returns its result as a JSON string."""
    if tool_name == 'scrape_tool':
        result = scrape_tool.run(**tool_input)
    elif tool_name == 'parse_tool':
        result = parse_tool.run(**tool_input)
    elif tool_name == 'dedup_tool':
        result = dedup_tool.run(**tool_input)
    else:
        result = {'error': f'Unknown tool: {tool_name}'}
    return json.dumps(result)


def run_for_source(source_url: str, source_type: str, dry_run: bool = False) -> dict:
    from guana_know.agents.models import AgentRun

    if not os.environ.get('AZURE_OPENAI_API_KEY'):
        raise EnvironmentError('AZURE_OPENAI_API_KEY environment variable is not set.')

    run_record = None
    if not dry_run:
        run_record = AgentRun.objects.create(status='running')

    try:
        client = AzureOpenAI(
            api_key=os.environ['AZURE_OPENAI_API_KEY'],
            azure_endpoint=os.environ['AZURE_OPENAI_ENDPOINT'],
            api_version=os.environ.get('AZURE_OPENAI_API_VERSION', '2025-01-01-preview'),
        )

        messages = [
            {
                'role': 'user',
                'content': (
                    f'Discover events from this source:\n'
                    f'URL: {source_url}\n'
                    f'Source type: {source_type}'
                ),
            }
        ]

        for _ in range(25):
            response = client.chat.completions.create(
                model=os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o-mini'),
                max_tokens=16000,
                tools=_TOOLS,
                messages=[{'role': 'system', 'content': _SYSTEM_PROMPT}] + messages,
            )

            message = response.choices[0].message
            messages.append({'role': 'assistant', 'content': message.content,
                             'tool_calls': [tc.model_dump() for tc in (message.tool_calls or [])]})

            if response.choices[0].finish_reason == 'stop':
                break

            if response.choices[0].finish_reason == 'tool_calls':
                tool_results = []
                for tc in (message.tool_calls or []):
                    logger.info('Calling tool: %s with input: %s', tc.function.name, tc.function.arguments)
                    result_str = _dispatch_tool(tc.function.name, json.loads(tc.function.arguments))
                    tool_results.append({
                        'role': 'tool',
                        'tool_call_id': tc.id,
                        'content': result_str,
                    })
                messages.extend(tool_results)
            else:
                logger.warning('Unexpected finish_reason: %s', response.choices[0].finish_reason)
                break

        final_text = (response.choices[0].message.content or '').strip()

        try:
            summary = json.loads(final_text)
        except (json.JSONDecodeError, ValueError):
            logger.error(
                'Orchestrator: could not parse final response as JSON.\nRaw: %s',
                final_text[:500]
            )
            summary = {
                'candidates': [],
                'error': 'invalid_final_response',
                'raw': final_text[:500],
            }

        if not dry_run:
            summary = _persist_candidates(summary, source_url)
        else:
            from django.utils.dateparse import parse_datetime
            from django.utils import timezone as tz
            for candidate in summary.get('candidates', []):
                event_data = candidate.get('event_data', {})
                # Prefer image_url from event_data; fall back to top-level if LLM put it there
                image_url = event_data.get('image_url') or candidate.get('image_url')
                # Guard: reject URLs that are not actual image files (e.g. LLM put source_url here)
                image_url = _sanitize_image_url(image_url)
                # Sync back so the report display is consistent
                event_data['image_url'] = image_url
                candidate['image_verification'] = _verify_image_url(image_url)

                # Flag past events for the dry-run report
                start_raw = event_data.get('start_datetime')
                if start_raw:
                    dt = parse_datetime(str(start_raw))
                    if dt:
                        if tz.is_naive(dt):
                            dt = tz.make_aware(dt)
                        candidate['is_past'] = dt < tz.now()
                    else:
                        candidate['is_past'] = False
                else:
                    candidate['is_past'] = False

        if run_record:
            run_record.status = 'completed'
            run_record.finished_at = datetime.now(timezone.utc)
            run_record.sources_processed = 1
            run_record.events_created = summary.get('written_events', 0)
            run_record.events_deduped = summary.get('total_duplicates', 0)
            run_record.save()

        return summary

    except Exception as exc:
        logger.exception('run_for_source failed for %s', source_url)
        if run_record:
            run_record.status = 'failed'
            run_record.finished_at = datetime.now(timezone.utc)
            run_record.errors = [str(exc)]
            run_record.save()
        raise


def _persist_candidates(summary: dict, source_url: str) -> dict:
    """
    Writes eligible candidates to the database.

    High-confidence candidates become Event(status=draft, source=agent).
    Low-confidence candidates become EventDraft(status=pending_review).
    """
    from guana_know.agents.models import EventDraft, EventSource
    from guana_know.events.models import Event

    candidates = summary.get('candidates', [])
    written_drafts = 0
    written_events = 0

    event_source = EventSource.objects.filter(url=source_url).first()

    if not event_source:
        logger.warning(
            '_persist_candidates: no EventSource found for url=%s, '
            'low-confidence candidates will be skipped.', source_url
        )

    for candidate in candidates:
        if candidate.get('is_duplicate'):
            continue

        event_data = candidate.get('event_data', {})
        confidence = candidate.get('confidence', 0.0)
        issues = candidate.get('issues', [])

        if confidence >= CONFIDENCE_AUTO_DRAFT and not issues:
            _create_agent_event(event_data, source_url, image_url=candidate.get('image_url'))
            written_events += 1
        elif event_source:
            EventDraft.objects.create(
                source=event_source,
                raw_text='',
                parsed_data=event_data,
                confidence=confidence,
                issues=issues,
                status='pending_review',
            )
            written_drafts += 1
        else:
            logger.warning(
                '_persist_candidates: skipping low-confidence candidate '
                '"%s" — no EventSource to attach draft to.',
                event_data.get('title', 'untitled')
            )

    summary['written_events'] = written_events
    summary['written_drafts'] = written_drafts
    return summary


def _sanitize_image_url(image_url: str | None) -> str | None:
    """
    Returns image_url only if it looks like an actual image file.
    Rejects page URLs that the LLM may have incorrectly used as image_url
    (e.g. the event source URL instead of a real image path).
    """
    if not image_url:
        return None
    _IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg')
    lower = image_url.lower().split('?')[0]  # strip query string before checking extension
    if any(lower.endswith(ext) for ext in _IMAGE_EXTENSIONS):
        return image_url
    return None


def _verify_image_url(image_url: str | None) -> dict:
    """
    Performs a HEAD request to verify an image URL is accessible.
    Returns a dict with status, content_type, and size_kb.
    Does not download the image body.
    """
    if not image_url:
        return {'status': 'none', 'detail': 'no image URL found'}

    import httpx
    try:
        response = httpx.head(
            image_url,
            timeout=5,
            follow_redirects=True,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; GuanaGoBot/1.0)'},
        )
        content_type = response.headers.get('content-type', 'unknown')
        content_length = response.headers.get('content-length')
        size_kb = round(int(content_length) / 1024) if content_length else None

        if response.status_code == 200 and content_type.startswith('image/'):
            return {
                'status': 'ok',
                'content_type': content_type.split(';')[0].strip(),
                'size_kb': size_kb,
            }
        else:
            return {
                'status': 'error',
                'http_status': response.status_code,
                'content_type': content_type,
            }
    except Exception as exc:
        return {'status': 'unreachable', 'detail': str(exc)}


def _download_and_store_image(image_url: str | None, event_title: str):
    """
    Downloads an image from image_url and saves it to Django's storage backend.

    Returns a ContentFile-wrapped image ready to assign to Event.image,
    or None if download fails or image_url is empty.
    """
    import httpx
    from django.core.files.base import ContentFile
    from django.utils.text import slugify

    if not image_url:
        return None

    try:
        response = httpx.get(
            image_url,
            timeout=10,
            follow_redirects=True,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; GuanaGoBot/1.0)'},
        )
        if response.status_code != 200:
            logger.warning(
                '_download_and_store_image: got %s for %s',
                response.status_code, image_url,
            )
            return None

        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            logger.warning(
                '_download_and_store_image: non-image content-type %s for %s',
                content_type, image_url,
            )
            return None

        ext_map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
        }
        ext = ext_map.get(content_type.split(';')[0].strip(), 'jpg')
        filename = f"{slugify(event_title[:50])}.{ext}"

        return ContentFile(response.content, name=filename)

    except Exception as exc:
        logger.warning(
            '_download_and_store_image: failed for %s — %s',
            image_url, exc,
        )
        return None


def _get_or_create_venue(name: str, owner) -> 'Venue | None':
    """
    Returns an existing Venue matching name (case-insensitive),
    or creates a new one with status='draft' so it appears in
    the admin for review before being published.
    """
    from django.utils.text import slugify
    from guana_know.venues.models import Venue

    try:
        existing = Venue.objects.filter(name__iexact=name).first()
        if existing:
            return existing

        base_slug = slugify(name)[:200]
        slug = base_slug
        counter = 1
        while Venue.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        venue = Venue.objects.create(
            owner=owner,
            name=name,
            slug=slug,
            description='',
            category='other',
            address='',
            city='Guanajuato',
            state='Guanajuato',
            status='draft',
        )
        return venue
    except Exception as exc:
        logger.error('_get_or_create_venue: failed to create venue "%s" — %s', name, exc)
        return None


def _create_agent_event(event_data: dict, source_url: str,
                        image_url: str | None = None) -> None:
    """
    Creates an Event(status=draft) from agent-parsed data.

    Skips fields that don't map cleanly; missing required fields cause the
    candidate to remain as EventDraft — this function is only called for
    high-confidence, issue-free candidates.
    """
    from django.utils.text import slugify
    from django.utils import timezone as tz
    from guana_know.venues.models import Venue

    title = event_data.get('title', '').strip()
    if not title:
        logger.warning('_create_agent_event: skipping event with no title')
        return

    start_raw = event_data.get('start_datetime')
    end_raw = event_data.get('end_datetime')

    start_dt = _parse_aware(start_raw)
    if not start_dt:
        logger.warning('_create_agent_event: skipping "%s" — no valid start_datetime', title)
        return

    if start_dt < tz.now():
        logger.info(
            '_create_agent_event: skipping past event "%s" (start: %s)',
            title, start_dt.isoformat()
        )
        return

    end_dt = _parse_aware(end_raw) or start_dt

    agent_user = _get_or_create_agent_user()
    if not agent_user:
        logger.warning('_create_agent_event: no agent user available, skipping "%s"', title)
        return

    venue_name = event_data.get('venue_name', '')
    venue = None
    if venue_name:
        venue = Venue.objects.filter(name__iexact=venue_name.strip()).first()

    if not venue:
        if venue_name:
            venue = _get_or_create_venue(venue_name.strip(), agent_user)
            logger.info(
                '_create_agent_event: auto-created venue "%s"', venue_name
            )
        else:
            venue = _get_or_create_venue('En línea', agent_user)
            logger.info(
                '_create_agent_event: no venue name found, '
                'using "En línea" for "%s"', title
            )

    if not venue:
        logger.warning('_create_agent_event: could not resolve venue for "%s", skipping', title)
        return

    agent_user = _get_or_create_agent_user()
    if not agent_user:
        logger.warning('_create_agent_event: no agent user available, skipping "%s"', title)
        return

    from guana_know.events.models import Event

    base_slug = slugify(title)[:200]
    slug = _unique_slug(base_slug)

    resolved_image_url = image_url or event_data.get('image_url') or ''
    image_file = _download_and_store_image(resolved_image_url or None, title)

    Event.objects.create(
        owner=agent_user,
        venue=venue,
        title=title,
        slug=slug,
        description=event_data.get('description') or '',
        category=event_data.get('category') or 'other',
        start_datetime=start_dt,
        end_datetime=end_dt,
        price=event_data.get('price') or 0,
        is_free=event_data.get('is_free', True),
        registration_url=event_data.get('registration_url') or None,
        image=image_file,
        image_source_url=resolved_image_url,
        status='draft',
        source='agent',
        source_url=source_url,
    )


def _parse_aware(value: str | None):
    from django.utils.dateparse import parse_datetime
    from django.utils import timezone

    if not value:
        return None
    dt = parse_datetime(str(value))
    if dt is None:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def _get_or_create_agent_user():
    """Returns a system user for agent-created content."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username='agent',
        defaults={
            'email': 'agent@guanaknow.internal',
            'is_active': False,
        },
    )
    return user


def _unique_slug(base: str) -> str:
    from guana_know.events.models import Event

    slug = base
    counter = 1
    while Event.objects.filter(slug=slug).exists():
        slug = f'{base}-{counter}'
        counter += 1
    return slug
