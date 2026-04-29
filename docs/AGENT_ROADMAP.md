# Guana Know — Agent Implementation Roadmap

## Overview

Three milestones. Each is independently deployable and testable.

The agent layer does NOT replace the existing Django API — it writes to the same database through the same models.

---

## Milestone 1 — Schema + Agent State + MCP Tools + Discovery Loop

**Goal:** The agent can monitor a registered URL, extract events, and save them as drafts in the database.

**Scope:**
- Django app `guana_know/agents/` with `EventSource` and `EventDraft` models
- Two new fields on `Event`: `source` and `source_url`
- MCP tools module (`backend/agents/tools/`)
  - `scrape_tool` — fetches URL content
  - `parse_tool` — extracts structured events from raw content via Azure OpenAI
  - `dedup_tool` — queries DB to detect duplicates
- Azure OpenAI orchestrator loop (`backend/agents/orchestrator.py`)
- Django management command: `run_discovery_agent`

**The loop for each `EventSource`:**
1. `scrape_tool` → fetches content from source URL
2. `parse_tool` → extracts candidate events from content
3. `dedup_tool` × N → checks each candidate for duplicates
4. For each non-duplicate candidate:
   - `confidence ≥ 0.80` → save as `Event(status=draft, source=agent)`
   - `confidence < 0.80` → save as `EventDraft(status=pending_review)`
5. Update `EventSource.last_scraped_at`

**Deliverables:**
- [x] `guana_know/agents/models.py` — EventSource, EventDraft
- [x] `guana_know/agents/admin.py` — review drafts in admin
- [x] `guana_know/events/models.py` — source + source_url fields
- [x] Migrations for both changes (`agents/0001_initial.py`, `agents/0002_agentrun_and_more.py`, `events/0003_event_agent_source.py`)
- [x] `backend/agents/tools/scrape_tool.py`
- [x] `backend/agents/tools/parse_tool.py`
- [x] `backend/agents/tools/dedup_tool.py`
- [x] `backend/agents/orchestrator.py`
- [x] `guana_know/agents/management/commands/run_discovery_agent.py`
- [x] `requirements.txt` — openai, httpx, beautifulsoup4

> **Note:** `AgentRun` model (roadmapped for Milestone 3) is already implemented in `guana_know/agents/models.py` and used by the orchestrator.

**Environment variables required:**
```
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://<resource>.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

**Definition of done:** Running `python manage.py run_discovery_agent` against a real museum website URL registered in `EventSource` creates `EventDraft` rows in the database.

**Status: ✅ COMPLETE** — All deliverables implemented and migrations applied.

**How to test:**
1. Ensure the database is running and migrations are applied: `python manage.py migrate`
2. Register an `EventSource` via the Django admin (or shell): a museum/venue website URL.
3. Set the env vars: `export AZURE_OPENAI_API_KEY=...`, `export AZURE_OPENAI_ENDPOINT=...`, `export AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini`
4. Dry-run first (no DB writes): `python manage.py run_discovery_agent --dry-run`
5. Full run: `python manage.py run_discovery_agent`
6. Verify rows in `EventDraft` (admin → Agents → Event Drafts) and `Event` (status=draft, source=agent).
7. To target a specific source: `python manage.py run_discovery_agent --source-id <uuid>`

---

## Milestone 2 — Robustness + Admin Review UI

**Goal:** Make Milestone 1 production-ready. Add the admin workflow to review drafts.

**Scope:**
- Per-source rate limiting and configurable crawl interval
- Retry logic and error logging per `EventSource`
- Admin inline to approve `EventDraft` → promote to `Event`
- `EventDraft` bulk approve/reject action in Django admin
- Basic test suite for tools and orchestrator (mocked external calls)
- New `EventSource` fields: `crawl_interval_hours`, `error_count`, `last_error`

**Deliverables:**
- [x] Migration adding `crawl_interval_hours`, `error_count`, `last_error` to `EventSource`
- [x] `run_discovery_agent` respects `last_scraped_at + crawl_interval_hours`
- [x] Admin action: `Approve selected drafts` — now promotes draft → Event via `services.promote_draft_to_event()`
- [x] Admin action: `Reject selected drafts`
- [x] `EventDraft` → `Event` promotion logic in `guana_know/agents/services.py`
- [x] Tests for `parse_tool`, `dedup_tool` (mocked responses) — 15 tests, all passing

**Status: ✅ COMPLETE**

---

## Milestone 3 — Semantic Enrichment + Scheduled Execution

**Goal:** The agent can resolve venue ambiguity via embeddings. Discovery runs automatically on a schedule.

**Scope:**
- `pgvector` extension on PostgreSQL
- `Venue.embedding` vector field (1536 dimensions)
- Venue matching in `parse_tool`: if venue name doesn't match exactly, fall back to nearest embedding
- Celery + Redis for periodic task scheduling
- `scrape_tool` extension: Instagram Basic Display API or Apify integration for social sources
- Agent run logs stored in the DB (`AgentRun` model)

**Deliverables:**
- [x] `AgentRun` model for audit trail *(already implemented in Milestone 1 — no additional work needed)*
- [ ] pgvector enabled in Dockerfile/docker-compose
- [ ] `Venue.embedding` field + migration
- [ ] Embedding generation command: `python manage.py generate_venue_embeddings`
- [ ] Semantic venue matching in orchestrator
- [ ] Celery worker + beat configuration
- [ ] Periodic task: `discover_events` every N hours

---

## General Considerations

### What the Agent Does NOT Do

- Never publishes events directly (`status=published` is always a human or explicit approval step)
- Never modifies existing published events
- Never exposes scraped content to frontend users

### Failure Modes

| Failure | Behavior |
|---|---|
| URL unreachable | Log error, increment `error_count`, skip source |
| Azure OpenAI API error | Abort run, log, do not create partial drafts |
| Parsed data missing required fields | Save as `EventDraft` with `confidence=0`, status `pending_review` |
| Duplicate detected | Skip silently, log dedup hit |

### Cost Considerations

- Each orchestrator run consumes Azure OpenAI API tokens
- `parse_tool` is the most expensive call (long context)
- Milestone 2 adds `crawl_interval_hours` to prevent unnecessary re-scraping
- Use `gpt-4o-mini` for all stages (configurable via `AZURE_OPENAI_DEPLOYMENT`)

### Dependency on Existing Code

The agent layer imports from `guana_know` models via Django ORM. It must be run from the same Python environment as the Django project (i.e., with `DJANGO_SETTINGS_MODULE` set). The management command handles this automatically.
