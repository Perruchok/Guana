# Guana Know — Architecture

## System Overview

Frontend (Next.js)
        ↓
Django REST API
        ↓
PostgreSQL
        ↓
Stripe (subscriptions)

---

## Backend Structure

guana_know/
    config/
    users/
    venues/
    events/
    subscriptions/

Each app must:
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

Models should be designed to allow extension without refactoring core schema.
