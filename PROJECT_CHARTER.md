# Guana Know — Project Charter

## Mission

Guana Know begins as a local cultural calendar and will evolve into a digital infrastructure platform for community connection in Guanajuato.

The goal is to increase visibility of cultural spaces, events, and community initiatives while maintaining simplicity, trust, and usability.

---

## Scope (Phase 1 - MVP)

- Event listing platform
- Venue profiles
- Business owner accounts
- Event publication workflow
- Basic subscription tiers (Stripe integration)
- Public browsing of events and venues

---

## Non-Goals (MVP)

- International expansion
- High-scale distributed systems
- Social media clone
- Complex messaging systems
- Mobile app (for now)

---

## Core Principles

1. Simplicity over complexity
2. Clean architecture over premature optimization
3. Extensibility without overengineering
4. Clear domain modeling
5. Production-ready from day one

---

## Technology Stack

Backend:
- Python 3.11+
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication

Frontend:
- Next.js
- TailwindCSS

Infrastructure:
- Azure App Service
- Azure PostgreSQL
- Azure Blob Storage
- Stripe for subscriptions

---

## Architectural Philosophy

- Modular monolith
- Clear domain boundaries
- UUID primary keys
- RESTful API
- Clean separation between backend and frontend
