"""
scrape_tool — fetches raw HTML/text content from a URL.

Returns the visible text extracted from the page, suitable for event parsing.
Handles timeouts and HTTP errors gracefully.
"""

import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

TOOL_DEFINITION = {
    'type': 'function',
    'function': {
        'name': 'scrape_tool',
        'description': (
            'Fetches the content of a URL and returns its visible text. '
            'Use this first to get raw content from an event source.'
        ),
        'parameters': {
            'type': 'object',
            'properties': {
                'url': {
                    'type': 'string',
                    'description': 'The URL to scrape.',
                },
                'source_type': {
                    'type': 'string',
                    'description': 'Type of source: instagram, facebook, website, or twitter.',
                },
            },
            'required': ['url'],
        },
    }
}

_TIMEOUT_SECONDS = 15
_MAX_CONTENT_CHARS = 20_000
_ALLOWED_SCHEMES = {'http', 'https'}

_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (compatible; GuanaKnowBot/1.0; '
        '+https://guanaknow.mx/bot)'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
}


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise ValueError(f'URL scheme "{parsed.scheme}" is not allowed. Use http or https.')
    if not parsed.netloc:
        raise ValueError('URL must include a host.')


_EXCLUDE_IMAGE_KEYWORDS = ('logo', 'icon', 'avatar', 'banner', '/ads/', 'adtech', 'adserver', 'pixel', 'tracker', 'sprite')

_EVENT_LINK_MAX = 10


def _extract_event_links(soup, base_url: str) -> list[str]:
    """
    Extracts all internal links that look like event detail pages.
    Filters out navigation, external, and non-event links.
    """
    from urllib.parse import urljoin, urlparse

    base_domain = urlparse(base_url).netloc
    links: list[str] = []

    for a in soup.find_all('a', href=True):
        href = a['href']
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)

        # Only same-domain links
        if parsed.netloc != base_domain:
            continue

        # FIX 1: skip fragments (#main-content, etc)
        # parsed.fragment captures what comes after #
        if parsed.fragment:
            continue

        # Skip anchors, static files, admin, auth
        if any(skip in parsed.path for skip in (
            '#', '.css', '.js', '.png', '.jpg',
            '/admin', '/login', '/static',
        )):
            continue

        # Skip the index page itself
        if full_url.rstrip('/') == base_url.rstrip('/'):
            continue

        if full_url not in links:
            links.append(full_url)

    return links


def _extract_image_url(soup, base_url: str) -> str | None:
    """Returns the most relevant event image URL from a parsed page."""
    from urllib.parse import urljoin

    # Priority 1: og:image
    og = soup.find('meta', property='og:image')
    if og and og.get('content'):
        return og['content']

    # Priority 2: twitter:image
    tw = soup.find('meta', attrs={'name': 'twitter:image'})
    if tw and tw.get('content'):
        return tw['content']

    # Priority 3: first content image — search semantic containers first,
    # then content-like divs. Both sets are checked; using 'or' here would
    # silently skip the div search if <main>/<article> tags exist but carry
    # no images (e.g. Drupal sites that wrap content in custom divs).
    semantic_areas = soup.find_all(['main', 'article'])
    content_divs = soup.find_all(
        'div',
        class_=lambda c: c and any(k in c.lower() for k in ('content', 'event', 'body')),
    )
    for area in [*semantic_areas, *content_divs]:
        for img in area.find_all('img', src=True):
            src = img['src']
            if not any(kw in src.lower() for kw in _EXCLUDE_IMAGE_KEYWORDS):
                return urljoin(base_url, src)

    # Priority 4: any img tag on the page that looks like a content image
    for img in soup.find_all('img', src=True):
        src = img['src']
        if any(kw in src.lower() for kw in _EXCLUDE_IMAGE_KEYWORDS):
            continue
        # Must have an image-like extension or be under a known media path
        lower_src = src.lower()
        if any(lower_src.endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            return urljoin(base_url, src)

    return None


def run(url: str, **kwargs) -> dict:
    """
    Fetches a URL and returns its visible text content.

    Args:
        url: The URL to fetch.

    Returns:
        A dict with keys: content (str), fetched_at (ISO str), status_code (int).
        On error, returns content='' and an 'error' key.
    """
    try:
        _validate_url(url)
    except ValueError as exc:
        return {'content': '', 'fetched_at': _now_iso(), 'status_code': 0, 'error': str(exc), 'event_links': []}

    try:
        with httpx.Client(follow_redirects=True, timeout=_TIMEOUT_SECONDS, headers=_HEADERS) as client:
            response = client.get(url)
    except httpx.TimeoutException:
        logger.warning('scrape_tool: timeout fetching %s', url)
        return {'content': '', 'fetched_at': _now_iso(), 'status_code': 0, 'error': 'timeout', 'event_links': []}
    except httpx.RequestError as exc:
        logger.warning('scrape_tool: request error for %s: %s', url, exc)
        return {'content': '', 'fetched_at': _now_iso(), 'status_code': 0, 'error': str(exc), 'event_links': []}

    if response.status_code >= 400:
        logger.warning('scrape_tool: HTTP %d for %s', response.status_code, url)
        return {
            'content': '',
            'fetched_at': _now_iso(),
            'status_code': response.status_code,
            'error': f'HTTP {response.status_code}',
            'event_links': [],
        }

    content_type = response.headers.get('content-type', '')
    image_url = None
    event_links: list[str] = []
    if 'html' in content_type:
        soup = BeautifulSoup(response.text, 'html.parser')
        for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()
        text = soup.get_text(separator='\n', strip=True)
        image_url = _extract_image_url(soup, url)
        event_links = _extract_event_links(soup, url)
    else:
        text = response.text

    text = text[:_MAX_CONTENT_CHARS]

    return {
        'content': text,
        'fetched_at': _now_iso(),
        'status_code': response.status_code,
        'url': url,
        'truncated': len(text) >= _MAX_CONTENT_CHARS,
        'image_url': image_url,
        'event_links': event_links,
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
