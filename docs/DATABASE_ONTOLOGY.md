# Guana Know — Database Ontology

This document describes the core data ontology of Guana Know.

Guana Know begins as a local community calendar for Guanajuato and is designed to evolve into a digital community connection platform. The data model prioritizes:

- Clarity
- Local scope
- Moderate scale
- Clean separation of concerns
- Future extensibility without overengineering

---

# Core Philosophy

Guana Know models four primary entities:

1. Users
2. Subscriptions
3. Venues
4. Events

These represent the minimal backbone required to support:

- Community identity
- Cultural spaces
- Scheduled activities
- Future community interaction

---

# 1. User

The `User` model extends Django’s `AbstractUser`.

It represents both individuals and business owners.

## Key Fields

- `id` (UUID, primary key)
- `username`
- `email`
- `user_type` (individual | business)
- `bio`
- `avatar`
- `created_at`
- `updated_at`

## Conceptual Role

A User is a community participant.

They can:

- Create venues (if business owner)
- Create events (depending on permissions)
- Subscribe to other entities
- Participate in the local ecosystem

Users are identity anchors in the system.

---

# 2. Subscription

Subscriptions model the relationship between users and community entities.

They allow users to follow:

- Venues
- Events (optional, depending on design)
- Future entity types

## Conceptual Role

Subscriptions enable:

- Personalization
- Notifications
- Future recommendation systems
- Community graph formation

They are the foundation for evolving from a calendar into a connection network.

---

# 3. Venue

Represents a physical or cultural space.

Examples:

- Museums
- Cafés
- Theaters
- Cultural centers
- Public spaces

## Key Fields

- `owner` (User → ForeignKey)
- `name`
- `slug`
- `description`
- `category`
- `address`
- `city`
- `state`
- `postal_code`
- `latitude`
- `longitude`
- `phone`
- `email`
- `website`
- `image`
- `status` (draft | published | archived)
- `is_featured`
- `created_at`
- `updated_at`

## Conceptual Role

A Venue is a community node.

It is:

- A physical anchor
- A host of events
- A discoverable cultural entity

Venues allow Guana Know to map the cultural geography of the city.

---

# 4. Event

Represents a scheduled activity occurring at a specific time.

Events are the core of the initial calendar functionality.

## Typical Fields (Conceptual)

- `title`
- `description`
- `venue` (ForeignKey → Venue)
- `organizer` (ForeignKey → User)
- `start_datetime`
- `end_datetime`
- `status`
- `image`
- `is_featured`
- `created_at`
- `updated_at`

## Conceptual Role

An Event is a time-bound interaction opportunity.

It connects:

- Users
- Venues
- Community moments

Events are the primary driver of engagement in early versions of Guana Know.

---

# Entity Relationships Overview

User
 ├── owns → Venue
 ├── organizes → Event
 └── subscribes to → Venue / Event

Venue
 ├── owned by → User
 └── hosts → Event

Event
 ├── occurs at → Venue
 └── organized by → User

Subscription
 └── connects → User ↔ (Venue or Event)

---

# Architectural Principles

1. Local-first scope  
2. Moderate scale (not designed for massive global traffic)  
3. Clean separation of concerns  
4. Extensible without schema instability  
5. UUID-based identity for safety and API readiness  

---

# Evolution Path

Phase 1:
- Calendar discovery
- Venue directory
- Basic subscriptions

Phase 2:
- Personalized feeds
- Venue verification
- Featured content logic

Phase 3:
- Community graph
- Recommendations
- Cross-venue collaborations
- Reputation signals

---

# Summary

Guana Know’s ontology models:

Identity → Space → Time → Connection

User → Venue → Event → Subscription

This structure supports:

- A lightweight MVP
- Controlled infrastructure costs
- Clean architectural growth
- Long-term transformation into a community connection platform
