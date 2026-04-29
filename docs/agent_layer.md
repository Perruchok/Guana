# Guana Know — Agent Layer

## Purpose

The Agent Layer extends Guana Know with autonomous capabilities that reduce manual work for event discovery, ambiguity resolution, and information enrichment.

It operates independently from the Django request/response cycle and writes to the same PostgreSQL database.

---

## Problems Solved

### 1. Automatic Discovery
The agent monitors registered `EventSource` objects (Instagram of venues, Facebook pages, museum websites, etc.) and extracts event data without manual entry.

### 2. Ambiguity Resolution
When a source says "viernes a las 8" without a specific date, the agent infers, verifies, or marks the draft as incomplete rather than failing. Confidence scores communicate uncertainty.

### 3. Information Enrichment
The agent recognizes that "La Erre" is a known venue and enriches the extracted data with address, category, and event history. (Phase 2, requires pgvector for semantic matching.)

### 4. Personalized Recommendations
A user says "quiero algo para este fin de semana, me gusta la música en vivo pero no el reggaeton" and the agent reasons over the catalog. (Phase 2, requires RAG + embeddings.)

---

## Architecture

```
GPT-4o-mini Orchestrator (Azure OpenAI, function calling)
    │
    ├── scrape_tool   → fetches raw HTML/text from a URL
    ├── parse_tool    → extracts structured event data from raw text via LLM
    └── dedup_tool    → queries PostgreSQL to detect duplicate events
         │
         ▼
EventDraft (pending review) or Event(status=draft, source=agent)
```

GPT-4o-mini acts as the orchestrator: it decides which tool to call and in what order. The tools are Python functions registered with the OpenAI SDK `tools` parameter.

---

## Data Models

### EventSource
Represents a URL that the agent should monitor periodically.

| Field | Type | Notes |
|---|---|---|
| url | URLField | The source to monitor |
| source_type | CharField | `instagram`, `facebook`, `website` |
| venue | FK → Venue | Optional, links to known venue |
| last_scraped_at | DateTimeField | Null until first run |
| is_active | BooleanField | Toggle without deleting |

### EventDraft
Represents an event discovered by the agent that requires human review (or auto-approval when confidence is high).

| Field | Type | Notes |
|---|---|---|
| raw_text | TextField | Raw content scraped |
| parsed_data | JSONField | Structured data inferred by the LLM |
| confidence | FloatField | 0.0–1.0 |
| issues | JSONField | e.g. `['missing_date', 'venue_unresolved']` |
| status | CharField | `pending_review`, `approved`, `rejected` |
| source | FK → EventSource | Which source produced this |
| resolved_event | OneToOneField → Event | Set when approved |

### Event (additions)
Two new fields to trace agent-created content:

| Field | Type | Notes |
|---|---|---|
| source | CharField | `manual` (default) or `agent` |
| source_url | URLField | Original URL of the discovered event |

---

## Confidence Thresholds

| Confidence | Action |
|---|---|
| ≥ 0.80 | Create `Event(status=draft, source=agent)` directly |
| < 0.80 | Create `EventDraft(status=pending_review)` |

---

## Running the Agent

```bash
# Discover events from all active EventSources
python manage.py run_discovery_agent

# Discover from a specific source
python manage.py run_discovery_agent --source-id <uuid>

# Dry run (no DB writes)
python manage.py run_discovery_agent --dry-run
```

The command requires `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_ENDPOINT` in the environment.

---

## Security Considerations

- The agent never writes `Event(status=published)` directly — an approval step is always required
- Scraped HTML is never executed or rendered
- The orchestrator validates all parsed fields before writing to the DB
- Rate limits are respected per source (configurable via `EventSource`)

---

## Tool Definitions

### scrape_tool
```
Input:  { url: string }
Output: { content: string, fetched_at: string, status_code: int }
```
Fetches the HTML/text content of a URL. Returns raw content for the parser.

### parse_tool
```
Input:  { content: string, source_url: string, source_type: string }
Output: { events: [ { title, description, start_datetime, end_datetime,
                       venue_name, category, price, confidence, issues } ] }
```
Uses GPT-4o-mini to extract structured event data from raw text. Returns a list because one page may contain multiple events.

### dedup_tool
```
Input:  { title: string, venue_name: string, start_datetime: string }
Output: { is_duplicate: bool, existing_event_id: string | null }
```
Queries PostgreSQL to detect if an event with the same title + venue + start time already exists.

---

## Límites de extracción por run

El número de eventos extraídos por fuente está determinado por:

1. **Truncado del scraper**: `scrape_tool` limita el contenido
   a 8000 caracteres por página. En páginas de índice largas,
   solo los primeros N eventos son visibles para el agente.

2. **Iteraciones del loop**: El orchestrator tiene un límite de
   60 iteraciones (configurable via MAX_ITERATIONS). En la práctica
   el agente usa 4-6 iteraciones para procesar una fuente completa
   cuando el dedup se hace en batch.

3. **Decisión del modelo**: GPT decide qué URLs visitar basándose
   en el contenido visible. Eventos fuera del truncado no son
   descubiertos en ese run.

**Implicación operacional**: Para fuentes con muchos eventos,
el agente debe correr múltiples veces o el límite de truncado
debe aumentarse. La segunda ejecución sobre la misma fuente
detectará los eventos ya guardados como duplicados y los saltará.

---

## Phase 2 Extensions

- `pgvector` on `Venue.embedding` for semantic venue matching
- RAG endpoint: embed events + user query → GPT-4o-mini recommendation
- Scheduled periodic scraping via Celery + Redis
- Admin dashboard to review/approve/reject EventDrafts in bulk
