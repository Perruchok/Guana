'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import AdvancedFiltersSheet from '@/components/events/AdvancedFiltersSheet'
import EventRow from '@/components/events/EventRow'
import FilterChips from '@/components/events/FilterChips'
import { useEventFilterState } from '@/hooks/useEventFilterState'
import { getEventDateGroupLabel, getEventDateKey, toEventApiFilters } from '@/lib/event-filters'
import { events as eventsApi } from '@/lib/api'
import type { EventListItem } from '@/types'

interface EventsGridProps {
  initialEvents: EventListItem[]
  initialTotal: number
}

const PAGE_SIZE = 12

export default function EventsGrid({ initialEvents, initialTotal }: EventsGridProps) {
  const { filters, updateFilters } = useEventFilterState()
  const [filterOpen, setFilterOpen] = useState(false)
  const [events, setEvents] = useState(initialEvents)
  const [totalEvents, setTotalEvents] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const apiFilters = toEventApiFilters(filters, PAGE_SIZE)
  const requestKey = JSON.stringify(apiFilters)
  const initialRequestKey = JSON.stringify({
    status: 'published',
    ordering: 'start_datetime',
    page: 1,
    page_size: PAGE_SIZE,
    search: undefined,
    categories: undefined,
    is_free: undefined,
  })

  useEffect(() => {
    if (requestKey === initialRequestKey) {
      setEvents(initialEvents)
      setTotalEvents(initialTotal)
      setLoadError(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(false)

    eventsApi.list(apiFilters)
      .then((result) => {
        if (cancelled) return
        setEvents(result.results)
        setTotalEvents(result.count)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, initialEvents, initialTotal])

  const pageCount = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE))
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort((first, second) =>
      new Date(first.start_datetime).getTime() - new Date(second.start_datetime).getTime()
    )
    const groups = new Map<string, EventListItem[]>()
    sorted.forEach((event) => {
      const dateKey = getEventDateKey(event.start_datetime)
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), event])
    })
    return [...groups.entries()]
  }, [events])

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar eventos</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(event) => {
              updateFilters({ ...filters, searchQuery: event.target.value, page: 1 }, 'replace')
            }}
            placeholder="Buscar eventos"
            className="h-11 w-full rounded-full bg-slate-200 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </label>
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

      <div className="mb-2">
        <FilterChips
          filters={filters}
          onChange={(nextFilters) => updateFilters(nextFilters)}
        />
      </div>

      <AdvancedFiltersSheet
        open={filterOpen}
        current={filters}
        onApply={(nextFilters) => updateFilters(nextFilters)}
        onClose={() => setFilterOpen(false)}
      />

      {isLoading ? (
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex min-h-24 items-center gap-3" aria-hidden="true">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-md bg-slate-200" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex min-h-40 items-center justify-center border-y border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          No se pudieron cargar los eventos. Intenta de nuevo.
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center border-y border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          No hay eventos disponibles
        </div>
      ) : (
        <div>
          {groupedEvents.map(([dateKey, dayEvents]) => (
            <section key={dateKey} aria-label={getEventDateGroupLabel(dateKey)}>
              <h2 className="sticky top-20 z-10 bg-brand-bg py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {getEventDateGroupLabel(dateKey)}
              </h2>
              <div>
                {dayEvents.map((event) => <EventRow key={event.id} event={event} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {totalEvents > PAGE_SIZE && !isLoading && (
        <nav className="flex items-center justify-center gap-4 py-4" aria-label="Paginación de eventos">
          <button
            type="button"
            onClick={() => updateFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={filters.page === 1}
            aria-label="Pagina anterior"
            title="Pagina anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Página {filters.page} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() => updateFilters({ ...filters, page: Math.min(pageCount, filters.page + 1) })}
            disabled={filters.page === pageCount}
            aria-label="Pagina siguiente"
            title="Pagina siguiente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  )
}
