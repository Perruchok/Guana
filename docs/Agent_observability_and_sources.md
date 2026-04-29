# Guana Go — Agent Observability & Multi-Source Architecture

## Part 1: Observability

### What You Have Now

| Component | Status | Covers |
|---|---|---|
| `AgentRun` model | ✅ | Did it run? How many events? |
| Django logger | ✅ | Raw text logs per run |
| Dry run report | ✅ | Pre-flight verification |
| Tool call logging | ⚠️ Partial | Logged but not structured |
| Per-event trace | ❌ | Not implemented |
| Alerts | ❌ | Not implemented |
| Metrics over time | ❌ | Not implemented |

---

### The Three Levels of Observability

#### Level 1 — Outcome tracking (AgentRun)

What to store per run, beyond what you currently have:

```python
class AgentRun(BaseModel):
    # Current
    status             # 'running' | 'completed' | 'failed'
    finished_at
    sources_processed
    events_created
    events_deduped
    errors             # JSONField

    # Add these
    source_url         # URLField — which source triggered this run
    duration_seconds   # FloatField — total wall time
    total_tokens_used  # IntegerField — from response.usage
    tool_calls         # JSONField — full sequence of tool calls (see below)
    events_skipped_past     # IntegerField — past event filter count
    events_skipped_no_venue # IntegerField — venue resolution failures
    venues_created     # IntegerField — auto-created venues
```

The `tool_calls` field is your black box recorder. Structure:

```json
[
  {
    "tool": "scrape_tool",
    "input_summary": {"url": "https://...", "source_type": "website"},
    "result_summary": "200 OK, 2332 chars, 14 links found",
    "duration_ms": 450,
    "timestamp": "2026-04-24T17:41:30Z"
  },
  {
    "tool": "parse_tool",
    "input_summary": {"source_url": "https://.../evento-1"},
    "result_summary": "1 event extracted, confidence 0.95",
    "duration_ms": 2100,
    "timestamp": "2026-04-24T17:41:56Z"
  }
]
```

Truncate all values to 200 chars before storing — this is for debugging,
not reproduction.

---

#### Level 2 — Structured logging

Replace `logger.info('Calling tool: %s', name)` with structured log lines
that share a consistent `agent_run_id` key across every log entry in a run.

Install: `pip install structlog`

Pattern:

```python
import structlog

# At the start of run_for_source():
log = structlog.get_logger().bind(
    agent_run_id=str(run_record.id) if run_record else 'dry-run',
    source_url=source_url,
)

# Then use log everywhere instead of logger:
log.info('tool_called', tool='scrape_tool', url=source_url)
log.warning('past_event_skipped', title=title, start=str(start_dt))
log.error('venue_creation_failed', venue_name=venue_name, exc=str(exc))
log.info('event_created', title=title, venue=venue.name, confidence=confidence)
```

This makes every log line queryable. To see everything that happened in
run `abc-123`, grep: `agent_run_id=abc-123`.

Key events to log at each stage:

```
scrape_tool called          → url, source_type
scrape_tool result          → status_code, chars, links_found, truncated
parse_tool called           → source_url, content_length
parse_tool result           → events_extracted, avg_confidence
dedup_tool result per event → title, is_duplicate, method
past event skipped          → title, start_datetime
venue auto-created          → name, slug
event created               → title, venue, confidence, has_image
event draft created         → title, confidence, issues
run completed               → duration, events_created, drafts, skipped
```

---

#### Level 3 — Alerts

Minimum alert surface before launch:

**Alert 1 — Complete agent failure**
The agent crashed before writing anything.

```python
if result.get('error'):
    mail_admins(
        subject=f'[Guana Go] Agent failed: {source.url}',
        message=f"Error: {result['error']}\nRun ID: {run_record.id}",
        fail_silently=True,
    )
```

**Alert 2 — Zero results from an active source**
The agent ran successfully but found nothing. This usually means the
site changed its HTML structure.

```python
if result.get('total_found', 0) == 0 and not result.get('error'):
    mail_admins(
        subject=f'[Guana Go] Zero events found: {source.url}',
        message='The agent ran but extracted no events. Site structure may have changed.',
        fail_silently=True,
    )
```

**Alert 3 — High skip rate**
More than 80% of found events were skipped (past, no venue, low confidence).
Indicates a quality problem with the source or parser.

```python
total = result.get('total_found', 0)
created = result.get('written_events', 0)
if total > 0 and (created / total) < 0.2:
    mail_admins(
        subject=f'[Guana Go] High skip rate: {source.url}',
        message=f'{created}/{total} events saved. Check EventDrafts for details.',
        fail_silently=True,
    )
```

Configure in settings.py:

```python
ADMINS = [('Your Name', 'your@email.com')]
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# Or for dev: 'django.core.mail.backends.console.EmailBackend'
```

---

#### Post-Launch: Sentry

Already in your roadmap. Sentry catches unhandled exceptions automatically
with full stack traces and the state of every local variable. It is the
single highest-leverage observability tool for your stage.

Installation is one line:

```bash
pip install sentry-sdk
```

In settings.py:

```python
import sentry_sdk
sentry_sdk.init(
    dsn=config('SENTRY_DSN', default=''),
    traces_sample_rate=0.1,  # 10% of requests for performance monitoring
)
```

Sentry free tier covers your volume indefinitely.

---

### Admin Dashboard (Minimal, No Extra Dependencies)

Add a custom admin view for AgentRun that shows the health of
recent runs at a glance. In `agents/admin.py`:

```python
@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'source_url', 'status',
        'events_created', 'events_deduped',
        'events_skipped_past', 'venues_created',
        'duration_seconds',
    ]
    list_filter = ['status', 'created_at']
    ordering = ['-created_at']
    readonly_fields = ['tool_calls', 'errors']
```

This gives you a one-screen view of agent health history in the
Django admin without building a custom frontend.

---

### Observability Checklist

```
Pre-launch (do now):
  [ ] Add tool_calls, duration_seconds, source_url to AgentRun
  [ ] Add structlog with agent_run_id binding
  [ ] Add mail_admins alerts for failure and zero-results
  [ ] Update AgentRunAdmin for visibility

Post-launch (within first month):
  [ ] Add Sentry
  [ ] Add weekly summary email with AgentRun stats
  [ ] Add EventDraft review reminder if pending_review count > threshold
```

---

---

## Part 2: Multi-Source Architecture

### The Core Problem

Your current scraper works for `cultura.ugto.mx` because that site has:
- Predictable URL structure (`/eventos/<slug>`)
- `og:image` meta tags
- Clean visible text per event page
- Internal links in the index

A different site will have a different structure. The question is:
how do you add new sources without rewriting the scraper every time?

---

### The Two Failure Modes to Avoid

**Failure Mode A — One scraper to rule them all**
A single `scrape_tool` that tries to handle every site with
increasingly complex heuristics. Becomes unmaintainable after 3-4 sources.

**Failure Mode B — One scraper per site**
A custom scraper for each source. Scales linearly with sources.
Expensive to maintain when sites change.

---

### The Right Architecture: Strategy Pattern

Each `EventSource` declares its scraping strategy.
The `scrape_tool` dispatches to the right strategy.
New sources add a new strategy, not new conditionals.

```
EventSource.scrape_strategy
    'generic'         → current BeautifulSoup scraper (default)
    'cultura_ugto'    → site-specific extractor if needed
    'apify_instagram' → Apify-based scraper for Instagram
    'apify_facebook'  → Apify-based scraper for Facebook
    'ical'            → iCal feed parser (for sites that expose .ics)
    'json_ld'         → structured data extractor (schema.org Events)
```

This is one new field on `EventSource`:

```python
class EventSource(BaseModel):
    STRATEGY_CHOICES = [
        ('generic',          'Generic HTML scraper'),
        ('json_ld',          'JSON-LD structured data'),
        ('ical',             'iCal feed'),
        ('apify_instagram',  'Apify — Instagram'),
        ('apify_facebook',   'Apify — Facebook'),
    ]

    scrape_strategy = models.CharField(
        max_length=30,
        choices=STRATEGY_CHOICES,
        default='generic',
        help_text='Scraping strategy to use for this source.'
    )
```

The `scrape_tool` dispatch:

```python
def run(url: str, source_type: str = 'website',
        strategy: str = 'generic') -> dict:

    if strategy == 'json_ld':
        return _scrape_json_ld(url)
    elif strategy == 'ical':
        return _scrape_ical(url)
    elif strategy == 'apify_instagram':
        return _scrape_apify_instagram(url)
    elif strategy == 'apify_facebook':
        return _scrape_apify_facebook(url)
    else:
        return _scrape_generic(url)  # current implementation
```

---

### Why JSON-LD Should Be Your First Addition

Many cultural institutions (museums, universities) embed structured
event data directly in their HTML using schema.org/Event format:

```html
<script type="application/ld+json">
{
  "@type": "Event",
  "name": "Concierto de Jazz",
  "startDate": "2026-05-03T20:00",
  "location": {"name": "Teatro Juárez"},
  "image": "https://..."
}
</script>
```

If a site has this, you don't need GPT to parse anything.
The data is already structured. Extraction is deterministic,
free, and 100% reliable.

```python
def _scrape_json_ld(url: str) -> dict:
    import httpx
    import json
    from bs4 import BeautifulSoup

    response = httpx.get(url, timeout=10)
    soup = BeautifulSoup(response.text, 'html.parser')

    events = []
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                events.extend([d for d in data if d.get('@type') == 'Event'])
            elif data.get('@type') == 'Event':
                events.append(data)
        except json.JSONDecodeError:
            continue

    return {
        'content': '',           # no raw text needed
        'structured_events': events,  # already parsed
        'status_code': response.status_code,
        'url': url,
        'strategy': 'json_ld',
        'event_links': [],
    }
```

When `structured_events` is non-empty, the orchestrator skips
the `parse_tool` call entirely — the data is already structured.
This reduces LLM calls (and cost) to zero for those sources.

---

### Site Compatibility Checklist

Before adding a new EventSource, run this evaluation:

```
1. Does the site have JSON-LD?
   → Check: view-source, search for "application/ld+json"
   → If yes: use strategy='json_ld', skip parse_tool

2. Does the site have an iCal feed?
   → Check: look for /events.ics or /feed/ical links
   → If yes: use strategy='ical', skip scrape + parse entirely

3. Does the site have og:image meta tags?
   → Check: view-source, search for "og:image"
   → If yes: generic scraper will extract images correctly

4. Does the site render content server-side?
   → Check: curl the URL and see if events appear in raw HTML
   → If no (JavaScript-rendered): generic scraper won't work,
     need Apify or Playwright

5. Does the site have internal links on the index page?
   → Check: inspect event_links output from scrape_tool
   → If no: GPT will try to infer from text — lower reliability

6. What is the site's update frequency?
   → Set EventSource.crawl_interval_hours accordingly
   → Cultural institutions: 24-48h is sufficient
```

---

### Adding a New Source — Standard Process

```
Step 1: Run scrape_tool manually on the index URL
        → Check content, event_links, truncated flag

Step 2: Run scrape_tool on one individual event URL
        → Check content quality, image_url extraction

Step 3: Determine strategy
        → json_ld? ical? generic?

Step 4: Register EventSource in admin
        → Set url, source_type, scrape_strategy, crawl_interval_hours

Step 5: Run dry-run
        → python manage.py run_discovery_agent --url <url> --dry-run
        → Verify events, confidence, images, venues

Step 6: Run real
        → Remove --dry-run
        → Check AgentRun in admin
        → Review auto-created venues and EventDrafts
```

---

### Source Registry (Maintain This as You Add Sources)

| Source | URL | Strategy | Notes |
|---|---|---|---|
| Cultura UG | cultura.ugto.mx/eventos-agendacultural | generic | Working. 9-13 events per run. |
| — | — | — | Add new sources here |

---

### What Breaks When a Site Changes

Sites change their HTML. When they do, the agent degrades gracefully
rather than crashing — but you need to know it happened.

| Change | Impact | Detection |
|---|---|---|
| URL structure changes | event_links break | Zero results alert |
| CSS classes change | Link extraction degrades | Fewer events than usual |
| og:image removed | No images extracted | Image field null in events |
| Content moved behind JS | Full scrape failure | status_code 200 but empty content |
| Site adds pagination | Only first page scraped | Fewer events than expected |

The zero-results alert (Level 3 observability) catches most of these
automatically. For subtler degradation (fewer events, no images),
a weekly manual review of AgentRun stats is sufficient at your scale.

---

### Complexity Budget

The goal is to keep the agent simple. Each strategy adds complexity.
Use this as a guide:

```
generic (current)      → handles 70% of cultural institution websites
json_ld                → handles another 15%, zero LLM cost
ical                   → handles another 5%, zero LLM cost
apify_instagram        → handles Instagram, adds Apify dependency + cost
apify_facebook         → handles Facebook, adds Apify dependency + cost
custom per-site        → last resort, only if source has unique high value
```

Implement in that order. Don't add Apify until you have real demand
for Instagram/Facebook sources that justify the cost.