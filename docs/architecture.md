# Guana Know — Architecture

## System Overview

```
Frontend (Next.js)
        ↓
Django REST API
        ↓
PostgreSQL
        ↓
Stripe (subscriptions)

Autonomous Agent Layer
        ↓  (reads external sources)
scrape_tool / parse_tool / dedup_tool
        ↓  (writes to)
PostgreSQL  ←→  EventSource / EventDraft / Event
        ↑
GPT-4o-mini Orchestrator (Azure OpenAI)
```

The agent layer operates independently from the request/response cycle.
It monitors external sources and writes to the database as a background process.
The frontend is agnostic to whether an event was created by a human or an agent.

---

## Backend Structure

guana_know/
    config/
    users/
    venues/
    events/
    subscriptions/
    agents/          ← agent state: EventSource, EventDraft

agents/              ← standalone agent module (outside Django apps)
    orchestrator.py
    tools/
        scrape_tool.py
        parse_tool.py
        dedup_tool.py

Each Django app must:
- Contain its own models
- Contain serializers
- Contain viewsets
- Define its own urls
- Avoid cross-app logic leakage

---

## Architectural Rules

- UUID primary keys for all models
- created_at and updated_at in all tables
- Business logic should not live in serializers
- Permissions must be explicit
- No fat views
- Avoid circular dependencies
- Use services layer if business complexity increases

---

## Agent Layer Rules

- Agents never write directly to `Event` with `status=published`
- All agent-created content enters as `EventDraft` or `Event(status=draft)`
- A human or automated approval step promotes drafts to published
- Agent confidence score determines if a draft needs human review
- Confidence threshold: ≥ 0.80 → auto-approve; < 0.80 → pending human review
- All agent writes are traceable via `source='agent'` and `source_url` on `Event`
- The orchestrator runs as a Django management command: `run_discovery_agent`

---

## Authentication

- JWT-based authentication
- Public read access to published events
- Auth required for content creation
- Owners can only manage their own venues/events

---

## Extensibility Guidelines

Future modules may include:
- Community groups
- User follow relationships
- Notifications
- Messaging
- Analytics dashboards
- Semantic search / RAG-based event recommendations (Phase 2 agent feature)

Models should be designed to allow extension without refactoring core schema.
