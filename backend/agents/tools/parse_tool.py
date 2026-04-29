"""
parse_tool — extracts structured event data from raw scraped text.

Calls the Azure OpenAI API directly (not via the orchestrator loop) to extract
a list of candidate events. Each candidate includes a confidence score and
a list of issues (e.g. missing_date, venue_unresolved).
"""

import json
import logging
import os

from openai import AzureOpenAI

logger = logging.getLogger(__name__)

TOOL_DEFINITION = {
    'type': 'function',
    'function': {
        'name': 'parse_tool',
        'description': (
            'Extracts structured event data from raw text scraped from a source. '
            'Returns a list of candidate events with confidence scores.'
        ),
        'parameters': {
            'type': 'object',
            'properties': {
                'content': {
                    'type': 'string',
                    'description': 'Raw text content from the source page.',
                },
                'source_url': {
                    'type': 'string',
                    'description': 'The original URL of the source.',
                },
                'source_type': {
                    'type': 'string',
                    'description': 'Type of source: instagram, facebook, website, or twitter.',
                },
                'image_url': {
                    'type': 'string',
                    'description': 'Image URL extracted by scrape_tool. Pass through to each event candidate.',
                },
            },
            'required': ['content', 'source_url', 'source_type'],
        },
    }
}

_SYSTEM_PROMPT = """\
You are an event extraction assistant for Guana Know, a cultural calendar for Guanajuato, Mexico.

Your task: extract cultural events from raw text and return structured JSON.

Rules:
- Extract ALL events mentioned, even if details are incomplete.
- For each event, assign a confidence score (0.0 to 1.0) based on how complete the data is.
- If a field cannot be determined, use null.
- Infer the year from context. If today is April 2026 and the text says "viernes 24", assume the nearest upcoming Friday the 24th.
- Use ISO 8601 for datetimes (YYYY-MM-DDTHH:MM:00).
- Timezone assumption: America/Mexico_City (UTC-6).
- If you cannot determine start_datetime, include "missing_date" in issues.
- If you cannot resolve the venue, include "venue_unresolved" in issues.
- category must be one of: exhibition, performance, workshop, conference, festival, cinema, music, theater, dance, art, literature, other.
- If image_url is provided in the input, include it in EVERY event candidate you extract from this source. It is a page-level image that applies to all events on the page.

Return ONLY a JSON object with this exact structure:
{
  "events": [
    {
      "title": "string",
      "description": "string or null",
      "start_datetime": "ISO8601 or null",
      "end_datetime": "ISO8601 or null",
      "venue_name": "string or null",
      "category": "string",
      "price": 0,
      "is_free": true,
      "registration_url": "string or null",
      "image_url": "string or null",
      "confidence": 0.85,
      "issues": []
    }
  ]
}

Do not include any text outside the JSON object.
"""


def run(content: str, source_url: str, source_type: str,
        image_url: str | None = None) -> dict:
    """
    Parses raw content into a list of structured candidate events.

    Args:
        content: Raw text from the source page.
        source_url: Original URL for context.
        source_type: Type of source (instagram, facebook, website, twitter).

    Returns:
        A dict with key 'events' (list of dicts) or 'error' on failure.
    """
    if not os.environ.get('AZURE_OPENAI_API_KEY'):
        return {'events': [], 'error': 'AZURE_OPENAI_API_KEY not set'}

    client = AzureOpenAI(
        api_key=os.environ['AZURE_OPENAI_API_KEY'],
        azure_endpoint=os.environ['AZURE_OPENAI_ENDPOINT'],
        api_version=os.environ.get('AZURE_OPENAI_API_VERSION', '2025-01-01-preview'),
    )

    from datetime import date
    today = date.today().isoformat()

    user_message = (
        f'Today is {today}.\n'
        f'Source URL: {source_url}\n'
        f'Source type: {source_type}\n'
    )
    if image_url:
        user_message += f'Page image URL: {image_url}\n'
    user_message += f'\nContent:\n{content}'

    try:
        response = client.chat.completions.create(
            model=os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o-mini'),
            max_tokens=8192,
            messages=[
                {'role': 'system', 'content': _SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message},
            ],
        )
    except Exception as exc:
        logger.error('parse_tool: Azure OpenAI API error: %s', exc)
        return {'events': [], 'error': str(exc)}

    raw = (response.choices[0].message.content or '').strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error('parse_tool: failed to parse LLM response as JSON: %s\nRaw: %s', exc, raw[:500])
        return {'events': [], 'error': 'invalid JSON from LLM', 'raw': raw[:500]}

    if 'events' not in data or not isinstance(data['events'], list):
        return {'events': [], 'error': 'unexpected response structure', 'raw': raw[:500]}

    # Truncate descriptions so the orchestrator's final JSON stays within
    # the model's output token limit when many events are found.
    _MAX_DESCRIPTION_CHARS = 800
    for event in data['events']:
        desc = event.get('description')
        if desc and len(desc) > _MAX_DESCRIPTION_CHARS:
            event['description'] = desc[:_MAX_DESCRIPTION_CHARS].rstrip() + '…'

    return {'events': data['events']}
