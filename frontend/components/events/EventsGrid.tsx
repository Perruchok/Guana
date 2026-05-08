'use client'

import { useState } from 'react'
import EventCard from '@/components/events/EventCard'

export interface Event {
  id: string
  title: string
  category: string
  startDatetime: string
  venueName: string
  imageUrl: string | null
  slug: string
  isFree: boolean
  price: number
}

interface EventsGridProps {
  events: Event[]
  isLoading: boolean
}

export default function EventsGrid({ events, isLoading }: EventsGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleEvents = events.filter((event) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.venueName.toLowerCase().includes(normalizedQuery) ||
      event.category.toLowerCase().includes(normalizedQuery)

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filterValue) => filterValue.toLowerCase() === event.category.toLowerCase())

    return matchesSearch && matchesFilters
  })

  const removeFilter = (filterToRemove: string) => {
    setActiveFilters((currentFilters) =>
      currentFilters.filter((filterValue) => filterValue !== filterToRemove)
    )
  }

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Eventos</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-blue-light"
          >
            Filtrar por
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {activeFilters.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setActiveFilters([])}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-700"
              >
                Borrar filtros:
              </button>

              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filterValue) => (
                  <button
                    key={filterValue}
                    type="button"
                    onClick={() => removeFilter(filterValue)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:border-slate-400 hover:text-gray-700"
                  >
                    <span className="h-3 w-3 rounded-full bg-brand-blue" aria-hidden="true" />
                    <span>{filterValue}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar eventos"
            className="rounded-full bg-slate-200 py-2 pl-4 pr-9 text-xs font-semibold uppercase tracking-wide text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          No hay eventos disponibles
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              category={event.category}
              startDatetime={event.startDatetime}
              venueName={event.venueName}
              imageUrl={event.imageUrl}
              slug={event.slug}
              isFree={event.isFree}
              price={event.price}
              onClick={() => {}}
            />
          ))}
        </div>
      )}
    </section>
  )
}
