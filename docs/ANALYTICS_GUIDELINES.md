# Guana Know — Analytics Guidelines

## Purpose

This document defines the analytics architecture, design decisions, and implementation tasks for Guana Know.
It is the canonical reference for any AI-assisted implementation of analytics features.

Follow this document strictly. Do not introduce analytics tooling or patterns not listed here.

---

## Guiding Principles

- **Instrument now, visualize later.** Log signals from day one. Dashboards come after 30+ days of data.
- **Frontend + backend dual tracking.** GA4 handles aggregate UX analytics. Django handles structured intent signals joinable to the DB.
- **Privacy-first.** Anonymize session identifiers. Never log PII in analytics models. Comply with LFPDPPP (Mexican data protection law).
- **Fire and forget.** Analytics calls must never block the user experience. All signals are non-blocking.
- **Monetization-ready.** Analytics data is a core value driver for paid venue tiers. Design with that in mind from the start.

---

## Tooling Stack

| Tool | Purpose | Tier |
|---|---|---|
| Vercel Analytics | Page views, unique visitors, referrers, top pages | Free, enable immediately |
| Google Analytics 4 (GA4) | Custom event tracking, funnels, retention, geo breakdown | Free, requires cookie consent |
| Django `analytics` app | Intent signals, event/venue page views, DB-joinable data | Custom — build per this spec |

Do not use any other analytics tools without updating this document first.

---

## Legal Requirements

**Mexico — LFPDPPP compliance is mandatory before GA4 goes live.**

- Display a cookie consent banner on first visit.
- Link to `aviso de privacidad` and `términos y condiciones` from the banner.
- GA4 must only initialize after consent is granted.
- Use consent mode v2 if using Google Tag Manager.
- Vercel Analytics is cookieless and does not require consent — enable it unconditionally.

Cookie consent must be implemented before any GA4 snippet is added to production.

---

## Metrics Architecture

### Measurement Buckets

**1. Discovery Funnel**
- Sessions
- Event page views
- Venue page views
- Intent signals (directions, registration, phone, website clicks)

**2. Content Performance**
- Events with highest page views
- Events with highest intent signal rate
- Venues with highest engagement
- Category-level performance (music, theater, workshop, etc.)

**3. Acquisition**
- Traffic source breakdown (direct, organic, social, referral)
- Top referrers
- Geographic distribution (city, state)

---

## Frontend Implementation

### Setup

**File:** `lib/analytics.ts`

Create a single shared utility. All tracking calls across the app must go through this module. Do not call `gtag` directly from components.

```ts
export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
};
```

**GA4 initialization** must be gated on cookie consent. Use a `useConsent` hook or context that checks localStorage for a consent flag before calling `gtag('config', ...)`.

**Vercel Analytics** is added once in the root layout. It requires no consent gate.

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

### Custom Events to Instrument

All custom events must follow this naming convention: `noun_verb` in snake_case.

#### Event Page

| Signal | Event Name | Required Params |
|---|---|---|
| User views an event detail page | `event_view` | `event_id`, `event_title`, `category`, `venue_id`, `is_free` |
| User clicks "Get Directions" | `directions_click` | `event_id`, `venue_id`, `venue_name` |
| User clicks registration/ticket link | `registration_click` | `event_id`, `is_free`, `price` |
| User clicks to share an event | `event_share` | `event_id`, `share_method` |

#### Venue Page

| Signal | Event Name | Required Params |
|---|---|---|
| User views a venue profile | `venue_view` | `venue_id`, `venue_name`, `category` |
| User clicks venue phone number | `phone_click` | `venue_id` |
| User clicks venue website link | `website_click` | `venue_id` |
| User clicks "Get Directions" on venue | `directions_click` | `venue_id`, `venue_name` |

#### Discovery / Listing Pages

| Signal | Event Name | Required Params |
|---|---|---|
| User applies a category filter | `filter_applied` | `filter_type: 'category'`, `value` |
| User performs a search | `search_performed` | `query` (do not log PII; truncate to 100 chars) |
| User clicks an event card from listing | `event_card_click` | `event_id`, `position` (index in list) |

---

### Implementation Pattern for Intent Signals

Intent signals (directions, registration, phone, website) must also be sent to the Django backend endpoint in addition to GA4. Use this pattern:

```ts
// Example: directions click on an event page
const handleDirectionsClick = async () => {
  // 1. GA4 (non-blocking)
  trackEvent('directions_click', {
    event_id: event.id,
    venue_id: event.venue_id,
    venue_name: event.venue_name,
  });

  // 2. Django backend signal (non-blocking, fire and forget)
  fetch('/api/analytics/signal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signal_type: 'directions_click',
      event_id: event.id,
      venue_id: event.venue_id,
    }),
  }).catch(() => {}); // Silently ignore errors — never block UX

  // 3. Actual UX action
  window.open(directionsUrl, '_blank');
};
```

**Rule:** The UX action (step 3) must never wait on steps 1 or 2.

---

## Backend Implementation

### App: `guana_know/analytics`

Create a new Django app at `guana_know/analytics/`. Register it in `INSTALLED_APPS`.

---

### Models

**File:** `guana_know/analytics/models.py`

```python
from django.db import models
from guana_know.common.models import BaseModel


class EventPageView(BaseModel):
    """
    Logged when a user views an event detail page.
    session_key is a hashed/anonymized identifier — never store raw IP or user ID here.
    """
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='page_views'
    )
    session_key = models.CharField(max_length=64, blank=True)
    referrer = models.URLField(blank=True)
    user_agent = models.CharField(max_length=512, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['event', 'created_at']),
        ]


class IntentSignal(BaseModel):
    """
    Logged when a user takes a high-intent action on an event or venue.
    Either event or venue must be set; both can be set.
    """
    SIGNAL_TYPES = [
        ('directions_click', 'Directions Click'),
        ('registration_click', 'Registration Click'),
        ('phone_click', 'Phone Click'),
        ('website_click', 'Website Click'),
        ('event_share', 'Event Share'),
    ]

    event = models.ForeignKey(
        'events.Event',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='intent_signals'
    )
    venue = models.ForeignKey(
        'venues.Venue',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='intent_signals'
    )
    signal_type = models.CharField(max_length=50, choices=SIGNAL_TYPES, db_index=True)
    session_key = models.CharField(max_length=64, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['signal_type', 'created_at']),
            models.Index(fields=['event', 'signal_type']),
            models.Index(fields=['venue', 'signal_type']),
        ]
```

**Privacy rules for models:**
- `session_key` must be a SHA-256 hash of IP + User-Agent + date. Never store raw IP.
- Do not add a `user` ForeignKey here. Analytics data must remain separable from identity.
- Do not log search queries verbatim if they could contain names or personal information.

---

### Serializers

**File:** `guana_know/analytics/serializers.py`

```python
from rest_framework import serializers
from .models import IntentSignal, EventPageView


class IntentSignalSerializer(serializers.Serializer):
    signal_type = serializers.ChoiceField(choices=IntentSignal.SIGNAL_TYPES)
    event_id = serializers.UUIDField(required=False, allow_null=True)
    venue_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, data):
        if not data.get('event_id') and not data.get('venue_id'):
            raise serializers.ValidationError(
                'At least one of event_id or venue_id is required.'
            )
        return data


class EventPageViewSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
```

---

### Views

**File:** `guana_know/analytics/views.py`

```python
import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import IntentSignal, EventPageView
from .serializers import IntentSignalSerializer, EventPageViewSerializer
from guana_know.events.models import Event
from guana_know.venues.models import Venue


def anonymize_session(request) -> str:
    raw = (
        request.META.get('REMOTE_ADDR', '')
        + request.META.get('HTTP_USER_AGENT', '')
        + str(request.META.get('HTTP_X_FORWARDED_FOR', ''))
    )
    return hashlib.sha256(raw.encode()).hexdigest()


class IntentSignalView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'analytics'

    def post(self, request):
        serializer = IntentSignalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        event = None
        venue = None

        if data.get('event_id'):
            event = Event.objects.filter(id=data['event_id']).first()
        if data.get('venue_id'):
            venue = Venue.objects.filter(id=data['venue_id']).first()

        IntentSignal.objects.create(
            event=event,
            venue=venue,
            signal_type=data['signal_type'],
            session_key=anonymize_session(request),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class EventPageViewView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'analytics'

    def post(self, request):
        serializer = EventPageViewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        event = Event.objects.filter(id=serializer.validated_data['event_id']).first()
        if not event:
            return Response(status=status.HTTP_204_NO_CONTENT)

        EventPageView.objects.create(
            event=event,
            session_key=anonymize_session(request),
            referrer=request.META.get('HTTP_REFERER', '')[:200],
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

### URLs

**File:** `guana_know/analytics/urls.py`

```python
from django.urls import path
from .views import IntentSignalView, EventPageViewView

urlpatterns = [
    path('signal/', IntentSignalView.as_view(), name='analytics-signal'),
    path('pageview/', EventPageViewView.as_view(), name='analytics-pageview'),
]
```

Register in `config/urls.py`:

```python
path('api/analytics/', include('guana_know.analytics.urls')),
```

---

### Rate Limiting

Add an `analytics` throttle scope in `settings.py` to protect these public endpoints:

```python
REST_FRAMEWORK = {
    # ... existing config ...
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'analytics': '300/hour',
    }
}
```

---

### Admin

**File:** `guana_know/analytics/admin.py`

```python
from django.contrib import admin
from .models import IntentSignal, EventPageView


@admin.register(IntentSignal)
class IntentSignalAdmin(admin.ModelAdmin):
    list_display = ['signal_type', 'event', 'venue', 'created_at']
    list_filter = ['signal_type', 'created_at']
    readonly_fields = ['event', 'venue', 'signal_type', 'session_key', 'created_at']
    ordering = ['-created_at']


@admin.register(EventPageView)
class EventPageViewAdmin(admin.ModelAdmin):
    list_display = ['event', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['event', 'session_key', 'referrer', 'user_agent', 'created_at']
    ordering = ['-created_at']
```

---

## Monetization Connection

Analytics data powers the value proposition for paid venue tiers. This is a core product decision, not an afterthought.

**Free tier — visible to venue owners:**
- Total event views this month (aggregate count only)
- Total directions clicks this month (aggregate count)

**Paid tiers — unlocked progressively:**
- Per-event breakdown of views and intent signals
- Trend charts (weekly/monthly)
- Top referrer sources
- Category benchmarks ("your music events perform X% above average")

The Django `analytics` models are the source of truth for these dashboard queries. When building the venue owner dashboard, query `IntentSignal` and `EventPageView` filtered by venue/event ownership. Do not rely on GA4 for any data shown to paying customers — GA4 is for internal product insights only.

---

## Implementation Sequence

Complete tasks in this order. Do not skip steps.

### Phase 1 — Foundation (Do immediately)

- [ ] Enable Vercel Analytics from the Vercel dashboard (no code required)
- [ ] Create GA4 property; store measurement ID in environment variable `NEXT_PUBLIC_GA4_ID`
- [ ] Implement cookie consent banner in Next.js (required before GA4 loads in production)
- [ ] Add `aviso de privacidad` link to cookie banner
- [ ] Create `lib/analytics.ts` utility in Next.js
- [ ] Add Vercel `<Analytics />` to root layout

### Phase 2 — Frontend Events

- [ ] Instrument `event_view` on event detail page load
- [ ] Instrument `directions_click` on all "Get Directions" buttons (event and venue pages)
- [ ] Instrument `registration_click` on all registration/ticket links
- [ ] Instrument `venue_view` on venue detail page load
- [ ] Instrument `event_card_click` on event listing cards
- [ ] Instrument `filter_applied` on category filter interactions
- [ ] Instrument `phone_click` and `website_click` on venue profile pages

### Phase 3 — Backend Signals

- [ ] Create `guana_know/analytics` Django app
- [ ] Create `EventPageView` and `IntentSignal` models
- [ ] Run `makemigrations` and `migrate`
- [ ] Implement `IntentSignalView` and `EventPageViewView`
- [ ] Register URLs at `api/analytics/`
- [ ] Add `analytics` throttle scope to DRF settings
- [ ] Register models in Django admin
- [ ] Wire frontend intent signals to POST `api/analytics/signal/` alongside GA4 calls

### Phase 4 — Validation

- [ ] Verify GA4 events appear in GA4 DebugView during development
- [ ] Verify `IntentSignal` records are created in Django admin after frontend interactions
- [ ] Verify `EventPageView` records are created on event detail page visits
- [ ] Confirm session_key is hashed (never raw IP)
- [ ] Confirm analytics endpoints return 204 on valid input
- [ ] Confirm throttle limit rejects excessive requests

### Phase 5 — Venue Dashboard (Future — after 30 days of data)

- [ ] Design aggregate query for venue page view counts
- [ ] Design aggregate query for intent signal counts per venue/event
- [ ] Add `/api/venues/{id}/analytics/` endpoint (auth required, owner only)
- [ ] Surface basic stats on venue owner dashboard (free tier: totals only)
- [ ] Gate per-event breakdown behind paid subscription check

---

## Out of Scope (Do Not Build Yet)

- Custom analytics dashboard in the admin UI
- Real-time analytics (websockets, live counters)
- Heatmaps or session recording (Hotjar, FullStory)
- A/B testing infrastructure
- Email open tracking
- Push notification analytics

Revisit these after reaching consistent traffic (target: 500+ daily sessions).

---

## Environment Variables

Add to `.env.example` and Vercel environment config:

```
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
```

Do not add GA4 initialization server-side. GA4 is client-only.

---

## File Checklist

When implementation is complete, these files should exist:

**Frontend (Next.js)**
- `lib/analytics.ts` — shared tracking utility
- `components/CookieConsent.tsx` — consent banner
- `hooks/useConsent.ts` — consent state management

**Backend (Django)**
- `guana_know/analytics/__init__.py`
- `guana_know/analytics/apps.py`
- `guana_know/analytics/models.py`
- `guana_know/analytics/serializers.py`
- `guana_know/analytics/views.py`
- `guana_know/analytics/urls.py`
- `guana_know/analytics/admin.py`
- `guana_know/analytics/migrations/0001_initial.py`