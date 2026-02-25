'use client'
// app/(public)/HomeClient.tsx
// Handles all interactivity: slider, filter modal, event modal.

import { useState, useRef } from 'react'
import type { EventListItem, VenueListItem, Event, EventFilters } from '@/types'
import EventCard from '@/components/events/EventCard'
import FilterModal from '@/components/events/FilterModal'
import EventModal from '@/components/events/EventModal'
import { events as eventsApi } from '@/lib/api'
import { EVENT_CATEGORY_LABELS, EVENT_TAG_CLASSES, formatPrice } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  featuredEvents: EventListItem[]
  recentEvents:   EventListItem[]
  featuredVenues: VenueListItem[]
}

export default function HomeClient({ featuredEvents, recentEvents, featuredVenues }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null)

  // Filter state
  const [filterOpen, setFilterOpen]     = useState(false)
  const [activeFilters, setActiveFilters] = useState<EventFilters>({})
  const [filteredEvents, setFilteredEvents] = useState<EventListItem[]>(recentEvents)
  const [loadingEvents, setLoadingEvents]   = useState(false)

  // Event detail modal
  const [selectedEvent, setSelectedEvent]   = useState<Event | null>(null)
  const [loadingEvent, setLoadingEvent]     = useState(false)

  // ── Slider ──────────────────────────────────
  const slide = (dir: number) => {
    sliderRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  // ── Filter ──────────────────────────────────
  const handleApplyFilters = async (filters: EventFilters) => {
    setActiveFilters(filters)
    setLoadingEvents(true)
    try {
      const res = await eventsApi.list(filters)
      setFilteredEvents(res.results)
    } catch {
      setFilteredEvents(recentEvents)
    } finally {
      setLoadingEvents(false)
    }
  }

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length

  // ── Event detail ─────────────────────────────
  const handleEventClick = async (event: EventListItem) => {
    setLoadingEvent(true)
    try {
      const detail = await eventsApi.get(event.id)
      setSelectedEvent(detail)
    } catch {
      // fallback: show partial data
      setSelectedEvent(event as unknown as Event)
    } finally {
      setLoadingEvent(false)
    }
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section className="px-6 md:px-10 py-12 border-b border-border">
        <p className="label mb-3">Guanajuato, México — Agenda cultural</p>
        <h1 className="font-display font-black leading-[0.92] tracking-tight text-ink"
            style={{ fontSize: 'clamp(3.2rem, 7vw, 6rem)' }}>
          Lo que<br />pasa en <em className="text-terracota italic">Gto.</em>
        </h1>
      </section>

      {/* ── Featured slider ── */}
      {featuredEvents.length > 0 && (
        <section className="px-6 md:px-10 py-10">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="label mb-1">Esta semana</p>
              <h2 className="font-display font-bold text-2xl tracking-tight">Destacados</h2>
            </div>
            <a href="#eventos" className="text-xs text-stone hover:text-terracota transition-colors">Ver todos →</a>
          </div>

          <div className="relative">
            <div
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto hide-scrollbar pb-4 scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {featuredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex-none w-[320px] md:w-[360px] h-52 rounded-sm overflow-hidden relative cursor-pointer
                             bg-ink hover:-translate-y-1 transition-transform duration-200"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill className="object-cover opacity-60" />
                  ) : (
                    <div className="w-full h-full"
                         style={{ background: 'linear-gradient(135deg,#2A1A0A,#5C3A1A)' }} />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5"
                       style={{ background: 'linear-gradient(transparent, rgba(26,22,18,0.9))' }}>
                    <p className="font-mono-gk text-[0.62rem] tracking-widest uppercase text-gold mb-1">
                      {EVENT_CATEGORY_LABELS[event.category]}
                    </p>
                    <p className="font-display font-bold text-cream text-[1.05rem] leading-snug">{event.title}</p>
                    <p className="text-[#D6CEBC] text-xs mt-1">
                      {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)} hrs
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {[-1, 1].map((dir) => (
                <button
                  key={dir}
                  onClick={() => slide(dir)}
                  className="w-9 h-9 border border-border rounded-sm flex items-center justify-center
                             hover:bg-ink hover:text-cream hover:border-ink transition-colors"
                  aria-label={dir === -1 ? 'Anterior' : 'Siguiente'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points={dir === -1 ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Eventos grid ── */}
      <section id="eventos" className="px-6 md:px-10 py-10 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="label mb-1">Agenda</p>
            <h2 className="font-display font-bold text-2xl tracking-tight">Eventos</h2>
            <div className="w-10 h-0.5 bg-terracota mt-2" />
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-2 border px-4 py-2 rounded-sm text-xs font-medium transition-colors
              ${activeFilterCount > 0
                ? 'bg-ink text-cream border-ink'
                : 'border-border text-ink hover:border-terracota hover:text-terracota'
              }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filtrar
            {activeFilterCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-terracota" />
            )}
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
                event={event}
                onClick={handleEventClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Directorio preview ── */}
      {featuredVenues.length > 0 && (
        <section id="directorio" className="px-6 md:px-10 py-10 border-t border-border bg-pale">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="label mb-1">Negocios locales</p>
              <h2 className="font-display font-bold text-2xl tracking-tight">Directorio</h2>
              <div className="w-10 h-0.5 bg-terracota mt-2" />
              <p className="text-sm text-stone mt-3 max-w-sm leading-relaxed">
                Descubre los negocios y espacios que hacen de Guanajuato un lugar único.
              </p>
            </div>
            <Link href="/directorio" className="text-xs text-stone hover:text-terracota transition-colors">
              Ver directorio completo →
            </Link>
          </div>

          <div className="border border-border rounded-sm overflow-hidden bg-white">
            {featuredVenues.map((venue, i) => (
              <Link
                key={venue.id}
                href={`/lugares/${venue.slug}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-pale transition-colors group
                  ${i < featuredVenues.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-11 h-11 rounded-sm bg-pale border border-border flex items-center justify-center
                                font-display font-bold text-stone text-sm shrink-0">
                  {venue.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink">{venue.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono-gk text-[0.58rem] tracking-widest uppercase px-1.5 py-0.5 bg-pale border border-border text-stone rounded-sm">
                      {VENUE_CATEGORY_LABELS[venue.category]}
                    </span>
                    <span className="text-xs text-stone">{venue.city}</span>
                  </div>
                </div>
                <svg className="text-border group-hover:text-terracota transition-colors" width="16" height="16"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
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

      {loadingEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40">
          <div className="w-8 h-8 border-2 border-cream border-t-terracota rounded-full animate-spin" />
        </div>
      )}

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </main>
  )
}
