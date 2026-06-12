'use client'
// app/(public)/HomeClient.tsx
// Handles all interactivity: slider, filter modal, event modal.

import { useRef, useState } from 'react'
import type { Event, EventCategory, EventListItem, VenueListItem, EventFilters } from '@/types'
import EventCard from '@/components/events/EventCard'
import EventModal from '@/components/events/EventModal'
import HeroCarousel, { type HeroSlide } from '@/components/sections/HeroCarousel'
import FilterModal from '@/components/events/FilterModal'
import { events as eventsApi } from '@/lib/api'
import Link from 'next/link'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'

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
  const pendingDetailEventIdRef = useRef<string | null>(null)

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

    // When list payload already includes description, no extra round-trip is required.
    if (event.description?.trim()) {
      pendingDetailEventIdRef.current = null
      return
    }

    pendingDetailEventIdRef.current = event.id
    try {
      const detailedEvent = await eventsApi.get(event.id)
      setSelectedEvent((current) => {
        if (!current || current.id !== event.id || pendingDetailEventIdRef.current !== event.id) {
          return current
        }
        return detailedEvent
      })
    } catch {
      // Keep fallback list data if detail fetch fails
    } finally {
      if (pendingDetailEventIdRef.current === event.id) {
        pendingDetailEventIdRef.current = null
      }
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

  const presentationHeroSlide: HeroSlide = {
    kind: 'ad',
    imageUrl: '/FULLSCREEN/Home1.png',
    mobileImageUrl: '/MOBILE/Home-m.png',
    imageAlt: 'Promoción destacada de Guana',
    href: '#eventos',
    showOverlay: false,
  }

  const advertisementHeroSlide: HeroSlide = {
    kind: 'ad',
    imageUrl: '/FULLSCREEN/Home1.png',
    mobileImageUrl: '/MOBILE/Home-m.png',
    imageAlt: 'Anuncio para promocionar tu espacio en Guana Go',
    title: 'Te gustaria aparecer\nen esta seccion?',
    subtitle: 'Promociona tu evento o espacio cultural en el hero principal.',
    ctaLabel: 'Contactanos',
    ctaHref: 'https://wa.me/524613409554',
    showOverlay: true,
  }

  const eventHeroSlides: HeroSlide[] = [...featuredEvents, ...recentEvents]
    .filter((event, index, allEvents) => {
      if (!event.image) {
        return false
      }

      return allEvents.findIndex((candidateEvent) => candidateEvent.id === event.id) === index
    })
    .slice(0, 4)
    .map((event) => ({
      kind: 'event' as const,
      title: `${event.title}\nGuanajuato, MX`,
      subtitle: `Descubre este evento en ${event.venue_name}`,
      imageUrl: event.image ?? '/hero-fallback.svg',
      ctaLabel: 'Ver evento',
      ctaHref: `/eventos/${event.slug}`,
    }))

  const fallbackEventSlide: HeroSlide = {
    kind: 'event',
    title: 'Lo que pasa\nen Gto.',
    subtitle: 'Descubre experiencias culturales destacadas en Guanajuato.',
    imageUrl: '/hero-fallback.svg',
    ctaLabel: 'Explorar eventos',
    ctaHref: '#eventos',
  }

  const resolvedHeroSlides: HeroSlide[] = [
    presentationHeroSlide,
    advertisementHeroSlide,
    ...(eventHeroSlides.length > 0 ? eventHeroSlides : [fallbackEventSlide]),
  ]

  return (
    <main className="bg-white">
      
      <HeroCarousel slides={resolvedHeroSlides} />

      <section aria-label="Subtexto promocional" className="mt-3 bg-white px-6 pt-6 md:mt-4 md:px-10 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <picture>
            <source media="(max-width: 767px)" srcSet="/MOBILE/Subtext-m.png" />
            <img
              src="/FULLSCREEN/Subtext.png"
              alt="Subtexto promocional de Guana"
              className="h-auto w-full"
              loading="lazy"
            />
          </picture>
        </div>
      </section>

      {/* ── Eventos grid ── */}
      <section id="eventos" className="px-6 md:px-10 py-10 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            {/* <p className="label mb-1">Agenda</p>
            <h2 className="font-display font-bold text-2xl tracking-tight">Eventos</h2> */}
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

      {/* ── Home banners ── */}
      <section id="directorio" className="border-t border-slate-300 bg-brand-bg px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:gap-6">
          <Link href="/cartelera" aria-label="Ir a cartelera" className="block overflow-hidden rounded-2xl border border-slate-300 bg-white">
            <picture>
              <source media="(max-width: 767px)" srcSet="/MOBILE/Banner1-m.png" />
              <img
                src="/FULLSCREEN/Banner1.png"
                alt="Explora la cartelera de Guana"
                className="h-auto w-full"
                loading="lazy"
              />
            </picture>
          </Link>

          <Link href="/directorio" aria-label="Ir a directorio" className="block overflow-hidden rounded-2xl border border-slate-300 bg-white">
            <picture>
              <source media="(max-width: 767px)" srcSet="/MOBILE/Banner2-m.png" />
              <img
                src="/FULLSCREEN/Banner2.png"
                alt="Explora el directorio de Guana"
                className="h-auto w-full"
                loading="lazy"
              />
            </picture>
          </Link>
        </div>
      </section>

      {/* ── Modals ── */}
      <FilterModal
        open={filterOpen}
        current={activeFilters}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />

      <EventModal
        event={selectedEvent}
        onClose={() => {
          pendingDetailEventIdRef.current = null
          setSelectedEvent(null)
        }}
      />
    </main>
  )
}
