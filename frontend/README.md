# Guana Know — Frontend

Next.js 14 frontend for the Guana Know cultural platform.

## Stack

- **Next.js 14** — App Router, Server Components, ISR
- **TypeScript** — strict mode
- **Tailwind CSS** — utility-first, extended with brand tokens
- **Google Fonts** — Playfair Display, DM Sans, DM Mono

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your Django backend

# 3. Run dev server
npm run dev
```

Open http://localhost:3000

## Environment variables

| Variable                | Description                        | Default                       |
|-------------------------|------------------------------------|-------------------------------|
| `NEXT_PUBLIC_API_URL`   | Django REST API base URL           | `http://localhost:8000/api`   |
| `API_URL`               | Server-side API URL (can differ)   | `http://localhost:8000/api`   |

## Project structure

```
frontend/
├── app/
│   ├── (public)/          # Public routes — no auth needed
│   │   ├── page.tsx       # Homepage (server component + ISR)
│   │   ├── HomeClient.tsx # All client interactivity
│   │   ├── eventos/[slug] # Event detail page (TODO)
│   │   ├── lugares/[slug] # Venue profile page (TODO)
│   │   └── directorio/    # Directory page (TODO)
│   ├── (auth)/
│   │   ├── entrar/        # Login
│   │   └── registro/      # Registration (2-step)
│   └── (dashboard)/
│       └── dashboard/     # Protected venue owner area
├── components/
│   ├── layout/            # Navbar, Footer
│   ├── events/            # EventCard, EventModal, FilterModal
│   ├── venues/            # VenueCard (TODO)
│   └── directorio/        # DirectorioItem (TODO)
├── lib/
│   ├── api.ts             # ALL backend calls — never fetch directly
│   ├── auth.ts            # JWT token management (cookies)
│   └── utils.ts           # Labels, formatters, helpers
└── types/
    └── index.ts           # TypeScript types mirroring Django models
```

## Architecture rules

1. **All API calls go through `lib/api.ts`** — never `fetch()` directly in components
2. **Server Components for data fetching** — pages are async server components; pass data down to Client Components
3. **Client Components for interactivity** — modals, forms, state
4. **Types mirror Django models** — update `types/index.ts` when the backend changes
5. **Tokens in cookies** — not localStorage; cookies are readable by Next.js server components

## Wiring to the real API

The homepage fetches live data from Django on every request (revalidated every 60s via ISR). Once your Django backend is running:

```bash
# Django dev server
cd ../backend && python manage.py runserver

# Then in another terminal
cd frontend && npm run dev
```

Events grid, featured slider, and directory will populate from the real database.

## Pages status

| Page                   | Status         | Notes                              |
|------------------------|----------------|------------------------------------|
| Homepage               | ✅ Done         | Server fetch + client interactivity |
| Filter modal           | ✅ Done         | Category + date + free filter       |
| Event detail modal     | ✅ Done         | Full detail, maps link, share       |
| Login                  | ✅ Done         | JWT, cookie storage                 |
| Register               | ✅ Done         | 2-step: type selection + form       |
| Dashboard home         | ✅ Done         | Auth guard, subscription banner     |
| Event detail page      | 🔲 TODO         | `/eventos/[slug]`                   |
| Venue profile page     | 🔲 TODO         | `/lugares/[slug]`                   |
| Directory page         | 🔲 TODO         | `/directorio` full list + filter    |
| Create event form      | 🔲 TODO         | `/dashboard/eventos/nuevo`          |
| Edit venue form        | 🔲 TODO         | `/dashboard/perfil`                 |
| Subscription page      | 🔲 TODO         | `/dashboard/suscripcion`            |

## Styles
Do not deviate from these — no new colors, no new fonts

Colors: cream #F5F0E8, ink #1A1612, terracota #C4622D, gold #D4A853, stone #8C7B6B, pale #EDE8DF, border #D6CEBC
Fonts: font-display (Playfair Display) for headings, font-sans (DM Sans) for body, font-mono-gk (DM Mono) for labels/tags
All API calls through lib/api.ts only — never fetch directly
All types from types/index.ts — never redefine
Spanish UI throughout
Auth token via tokenStore.getAccess() from lib/auth.ts
Server components fetch data; pass to 'use client' children for interactivity