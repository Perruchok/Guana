'use client'
// app/(public)/HomeClient.tsx
// Handles all interactivity: slider, filter modal, event modal.

import { useState } from 'react'
import type { Event, EventCategory, EventListItem, VenueListItem, EventFilters } from '@/types'
import EventCard from '@/components/events/EventCard'
import EventModal from '@/components/events/EventModal'
import HeroCarousel from '@/components/sections/HeroCarousel'
import FilterModal from '@/components/events/FilterModal'
import { events as eventsApi } from '@/lib/api'
import Link from 'next/link'
import { EVENT_CATEGORY_LABELS, VENUE_CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  featuredEvents: EventListItem[]
  recentEvents:   EventListItem[]
  featuredVenues: VenueListItem[]
}

function sortEventsBySoonest(events: EventListItem[]): EventListItem[] {
  return [...events].sort((a, b) => {
    const aTime = new Date(a.start_datetime).getTime()
    const bTime = new Date(b.start_datetime).getTime()
    return aTime - bTime
  })
}

const FILTER_DOT_CLASSES: Record<string, string> = {
  music: 'bg-blue-600',
  performance: 'bg-rose-600',
  cinema: 'bg-red-600',
  workshop: 'bg-teal-600',
  exhibition: 'bg-violet-600',
  dance: 'bg-pink-600',
  art: 'bg-orange-500',
  literature: 'bg-amber-600',
  festival: 'bg-green-600',
  conference: 'bg-indigo-600',
  theater: 'bg-brand-slate',
  other: 'bg-brand-slate',
}

type EventUiFilters = EventFilters & {
  categories?: EventCategory[]
}

export default function HomeClient({ featuredEvents, recentEvents, featuredVenues }: Props) {
  // Filter state
  const [filterOpen, setFilterOpen]     = useState(false)
  const [activeFilters, setActiveFilters] = useState<EventUiFilters>({})
  const [filteredEvents, setFilteredEvents] = useState<EventListItem[]>(sortEventsBySoonest(recentEvents))
  const [loadingEvents, setLoadingEvents]   = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const toModalEvent = (event: EventListItem): Event => ({
    ...(event as EventListItem & { description?: string; end_datetime?: string }),
    id: event.id,
    owner: '',
    owner_name: event.owner_name,
    venue: '',
    venue_name: event.venue_name,
    venue_slug: event.venue_slug,
    title: event.title,
    slug: event.slug,
    description: (event as EventListItem & { description?: string }).description ?? '',
    category: event.category,
    image: event.image,
    start_datetime: event.start_datetime,
    end_datetime:
      (event as EventListItem & { end_datetime?: string }).end_datetime ?? event.start_datetime,
    capacity: null,
    registered_count: 0,
    price: event.price,
    is_free: event.is_free,
    registration_url: null,
    status: 'published',
    is_featured: event.is_featured,
    is_upcoming: true,
    is_ongoing: false,
    is_past: false,
    created_at: '',
    updated_at: '',
  })

  const handleOpenEventModal = async (event: EventListItem) => {
    // Open instantly with list data, then hydrate with full detail (description, etc.)
    setSelectedEvent(toModalEvent(event))
    try {
      const detailedEvent = await eventsApi.get(event.id)
      setSelectedEvent(detailedEvent)
    } catch {
      // Keep fallback list data if detail fetch fails
    }
  }

  // ── Filter ──────────────────────────────────
  const handleApplyFilters = async (filters: EventUiFilters) => {
    setActiveFilters(filters)
    setLoadingEvents(true)
    try {
      const apiFilters: EventFilters = {
        ...filters,
        category:
          filters.categories && filters.categories.length === 1
            ? filters.categories[0]
            : undefined,
      }
      const res = await eventsApi.list(apiFilters)
      const eventsAfterCategoryFilter =
        filters.categories && filters.categories.length > 0
          ? res.results.filter((event) => filters.categories?.includes(event.category))
          : res.results

      setFilteredEvents(sortEventsBySoonest(eventsAfterCategoryFilter))
    } catch {
      setFilteredEvents(sortEventsBySoonest(recentEvents))
    } finally {
      setLoadingEvents(false)
    }
  }

  const activeFilterCount =
    (activeFilters.categories?.length ?? 0) +
    (activeFilters.is_free ? 1 : 0)

  const appliedFilterBadges: Array<{ key: string; label: string; dotClass: string; onRemove: () => void }> = []

  const selectedCategories = activeFilters.categories ?? (activeFilters.category ? [activeFilters.category] : [])

  selectedCategories.forEach((category) => {
    appliedFilterBadges.push({
      key: `category:${category}`,
      label: EVENT_CATEGORY_LABELS[category],
      dotClass: FILTER_DOT_CLASSES[category] ?? 'bg-brand-slate',
      onRemove: () => {
        const remainingCategories = selectedCategories.filter((value) => value !== category)
        void handleApplyFilters({
          ...activeFilters,
          category: undefined,
          categories: remainingCategories.length > 0 ? remainingCategories : undefined,
        })
      },
    })
  })

  if (activeFilters.is_free) {
    appliedFilterBadges.push({
      key: 'is_free',
      label: 'Gratis',
      dotClass: 'bg-brand-yellow',
      onRemove: () => {
        void handleApplyFilters({ ...activeFilters, is_free: undefined })
      },
    })
  }

  const heroSlides = [...featuredEvents, ...recentEvents]
    .filter((event, index, allEvents) => {
      if (!event.image) {
        return false
      }

      return allEvents.findIndex((candidateEvent) => candidateEvent.id === event.id) === index
    })
    .slice(0, 5)
    .map((event) => ({
      title: `${event.title}\nGuanajuato, MX`,
      subtitle: `Descubre este evento en ${event.venue_name}`,
      imageUrl: event.image ?? '/hero-fallback.svg',
      ctaLabel: 'Ver evento',
      ctaHref: `/eventos/${event.slug}`,
    }))

  const resolvedHeroSlides =
    heroSlides.length > 0
      ? heroSlides
      : [
          {
            title: 'Lo que pasa\nen Gto.',
            subtitle: 'Descubre experiencias culturales destacadas en Guanajuato.',
            imageUrl: '/hero-fallback.svg',
            ctaLabel: 'Explorar eventos',
            ctaHref: '#eventos',
          },
        ]

  return (
    <main className="bg-white">
      <HeroCarousel slides={resolvedHeroSlides} />

      {/* ── Eventos grid ── */}
      <section id="eventos" className="px-6 md:px-10 py-10 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="label mb-1">Agenda</p>
            <h2 className="font-display font-bold text-2xl tracking-tight">Eventos</h2>
            <div className="w-10 h-0.5 bg-terracota mt-2" />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-blue-light"
          >
            Filtrar por
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {activeFilterCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  void handleApplyFilters({
                    category: undefined,
                    categories: undefined,
                    is_free: undefined,
                  })
                }}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-700"
              >
                Borrar filtros:
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {appliedFilterBadges.map((badge) => (
                  <button
                    key={badge.key}
                    type="button"
                    onClick={badge.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:border-slate-400 hover:text-gray-700"
                  >
                    <span className={`h-3 w-3 rounded-full ${badge.dotClass}`} aria-hidden="true" />
                    <span>{badge.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {loadingEvents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="border border-border rounded-sm overflow-hidden animate-pulse">
                <div className="h-40 bg-pale" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-pale rounded w-1/3" />
                  <div className="h-4 bg-pale rounded w-3/4" />
                  <div className="h-3 bg-pale rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-stone">
            <p className="font-display text-xl mb-2">Sin resultados</p>
            <p className="text-sm">Intenta con otros filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                category={event.category}
                startDatetime={event.start_datetime}
                venueName={event.venue_name}
                imageUrl={event.image}
                slug={event.slug}
                isFree={event.is_free}
                price={event.price}
                onClick={() => { void handleOpenEventModal(event) }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Directorio preview ── */}
      {featuredVenues.length > 0 && (
        <section id="directorio" className="border-t border-slate-300 bg-brand-bg px-6 py-12 md:px-10">
          <div className="mx-auto max-w-6xl border-t border-slate-300 pt-6">
            <h2 className="text-center text-4xl font-extrabold uppercase italic tracking-tight text-brand-blue">
              Directorio
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm leading-tight text-slate-500">
              Compilamos cuidadosamente los servicios que Guanajuato capital tiene para ofrecerte.
              <span className="font-semibold italic text-slate-700"> Entretenimiento, Emergencias, Asistencia, Educación, Asociaciones, Dependencias y Comercios.</span>
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVenues.slice(0, 3).map((venue) => (
              <Link
                key={venue.id}
                href={`/lugares/${venue.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-300 bg-white"
              >
                {venue.image ? (
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200">
                    <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Sin imagen
                    </span>
                  </div>
                )}

                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" aria-hidden="true" />
                  <span>{VENUE_CATEGORY_LABELS[venue.category]}</span>
                </div>

                <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                  <div className="min-w-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    <span className="block truncate">{venue.name}</span>
                  </div>
                  <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-blue">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-blue">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/directorio"
              className="text-xl font-extrabold uppercase italic tracking-tight text-brand-blue transition-colors hover:text-brand-blue-light"
            >
              Ver más ›
            </Link>
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      <FilterModal
        open={filterOpen}
        current={activeFilters}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </main>
  )
}
