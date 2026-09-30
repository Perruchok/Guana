'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import FilterModal from '@/components/events/FilterModal'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'
import { events as eventsApi } from '@/lib/api'
import type { EventCategory, EventFilters, EventListItem } from '@/types'

export interface Event {
  id: string
  title: string
  category: EventCategory
  startDatetime: string
  venueName: string
  imageUrl: string | null
  slug: string
  isFree: boolean
  price: number
}

type EventUiFilters = EventFilters & {
  categories?: EventCategory[]
  datePeriod?: string
}

const FILTER_DOT_CLASSES: Record<EventCategory, string> = {
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

interface EventsGridProps {
  initialEvents: Event[]
  initialTotal: number
}

const PAGE_SIZE = 12

function toGridEvent(event: EventListItem): Event {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    startDatetime: event.start_datetime,
    venueName: event.venue_name,
    imageUrl: event.image,
    slug: event.slug,
    isFree: event.is_free,
    price: event.price,
  }
}

function getDateRange(datePeriod?: string) {
  if (!datePeriod) return {}

  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endDate = new Date(startDate)
  const formatDate = (date: Date) => date.toISOString().slice(0, 10)

  if (datePeriod === 'tomorrow') {
    startDate.setDate(startDate.getDate() + 1)
    endDate.setTime(startDate.getTime())
  } else if (datePeriod === 'week') {
    endDate.setDate(endDate.getDate() + 6)
  } else if (datePeriod === 'weekend') {
    const daysUntilSaturday = (6 - startDate.getDay() + 7) % 7
    startDate.setDate(startDate.getDate() + daysUntilSaturday)
    endDate.setDate(startDate.getDate() + 1)
  }

  return { start_date: formatDate(startDate), end_date: formatDate(endDate) }
}

export default function EventsGrid({ initialEvents, initialTotal }: EventsGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<EventUiFilters>({})
  const [events, setEvents] = useState(initialEvents)
  const [totalEvents, setTotalEvents] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const selectedCategories = activeFilters.categories ?? []
  const pageCount = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE))
  const apiFilters: EventFilters & { categories?: string } = {
    status: 'published',
    ordering: 'start_datetime',
    page,
    page_size: PAGE_SIZE,
    search: normalizedQuery || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
    is_free: activeFilters.is_free,
    ...getDateRange(activeFilters.datePeriod),
  }
  const requestKey = JSON.stringify(apiFilters)
  const initialRequestKey = useRef(JSON.stringify({ status: 'published', ordering: 'start_datetime', page: 1, page_size: PAGE_SIZE }))

  useEffect(() => {
    if (requestKey === initialRequestKey.current) return

    let cancelled = false
    setIsLoading(true)
    setLoadError(false)

    eventsApi.list(apiFilters)
      .then((result) => {
        if (cancelled) return
        setEvents(result.results.map(toGridEvent))
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
  }, [requestKey])

  const visibleEvents = events.filter((event) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.venueName.toLowerCase().includes(normalizedQuery) ||
      event.category.toLowerCase().includes(normalizedQuery)

    return matchesSearch
  })

  const handleApplyFilters = (filters: EventUiFilters) => {
    setActiveFilters(filters)
    setPage(1)
  }

  const removeCategoryFilter = (filterToRemove: EventCategory) => {
    const remainingCategories = selectedCategories.filter((filterValue) => filterValue !== filterToRemove)
    setActiveFilters((currentFilters) => ({
      ...currentFilters,
      categories: remainingCategories.length > 0 ? remainingCategories : undefined,
    }))
    setPage(1)
  }

  const activeFilterCount = selectedCategories.length + (activeFilters.is_free ? 1 : 0) + (activeFilters.datePeriod ? 1 : 0)

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Eventos</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <button
            type="button"
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
                  setActiveFilters({})
                  setPage(1)
                }}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-700"
              >
                Borrar filtros:
              </button>

              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((filterValue) => (
                  <button
                    key={filterValue}
                    type="button"
                    onClick={() => removeCategoryFilter(filterValue)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:border-slate-400 hover:text-gray-700"
                  >
                    <span className={`h-3 w-3 rounded-full ${FILTER_DOT_CLASSES[filterValue]}`} aria-hidden="true" />
                    <span>{EVENT_CATEGORY_LABELS[filterValue]}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}

                {activeFilters.is_free && (
                  <button
                    type="button"
                    onClick={() => setActiveFilters((currentFilters) => ({ ...currentFilters, is_free: undefined }))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:border-slate-400 hover:text-gray-700"
                  >
                    <span className="h-3 w-3 rounded-full bg-brand-yellow" aria-hidden="true" />
                    <span>Gratis</span>
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
            </>
          )}

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar eventos"
            className="rounded-full bg-slate-200 py-2 pl-4 pr-9 text-xs font-semibold uppercase tracking-wide text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <FilterModal
        open={filterOpen}
        current={activeFilters}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : loadError ? (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          No se pudieron cargar los eventos. Intenta de nuevo.
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
              href={`/eventos/${event.slug}`}
            />
          ))}
        </div>
      )}

      {totalEvents > PAGE_SIZE && !isLoading && (
        <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Paginacion de eventos">
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page === 1}
            aria-label="Pagina anterior"
            title="Pagina anterior"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pagina {page} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            disabled={page === pageCount}
            aria-label="Pagina siguiente"
            title="Pagina siguiente"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  )
}
