'use client'
// app/(public)/HomeClient.tsx
// Handles all interactivity: hero slider and quick/advanced event filters.
// Event cards navigate to /eventos/[slug], which opens as a modal via the
// @modal intercepted route when linked to from here.

import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { EventListItem, VenueListItem } from '@/types'
import EventCard from '@/components/events/EventCard'
import HeroCarousel, { type HeroSlide } from '@/components/sections/HeroCarousel'
import AdvancedFiltersSheet from '@/components/events/AdvancedFiltersSheet'
import FilterChips from '@/components/events/FilterChips'
import { useEventFilterState } from '@/hooks/useEventFilterState'
import { events as eventsApi } from '@/lib/api'
import { toEventApiFilters } from '@/lib/event-filters'
import Link from 'next/link'

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

export default function HomeClient({ featuredEvents, recentEvents, featuredVenues }: Props) {
  const { filters, updateFilters } = useEventFilterState()
  const [filterOpen, setFilterOpen]     = useState(false)
  const [filteredEvents, setFilteredEvents] = useState<EventListItem[]>(sortEventsBySoonest(recentEvents))
  const [loadingEvents, setLoadingEvents]   = useState(false)

  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    const hasFilters = Boolean(
      filters.categories.length || filters.datePeriod || filters.is_free || filters.searchQuery.trim()
    )
    if (!hasFilters) {
      setFilteredEvents(sortEventsBySoonest(recentEvents))
      setLoadingEvents(false)
      return
    }

    let cancelled = false
    setLoadingEvents(true)
    eventsApi.list(toEventApiFilters(filters))
      .then((result) => {
        if (!cancelled) setFilteredEvents(sortEventsBySoonest(result.results))
      })
      .catch(() => {
        if (!cancelled) setFilteredEvents(sortEventsBySoonest(recentEvents))
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false)
      })

    return () => {
      cancelled = true
    }
  }, [filterKey, recentEvents])

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
      <section id="eventos" className="border-t border-slate-300 px-4 py-8 md:px-10 md:py-10">
        <div className="mb-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FilterChips
              filters={filters}
              onChange={(nextFilters) => updateFilters(nextFilters)}
            />
          </div>
          <button
            type="button"
            title="Filtros avanzados"
            aria-label="Abrir filtros avanzados"
            onClick={() => setFilterOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-blue px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-light"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Filtros</span>
          </button>
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
                href={`/eventos/${event.slug}`}
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

      {/* ── Filters sheet ── */}
      <AdvancedFiltersSheet
        open={filterOpen}
        current={filters}
        onApply={(nextFilters) => updateFilters(nextFilters)}
        onClose={() => setFilterOpen(false)}
      />
    </main>
  )
}
