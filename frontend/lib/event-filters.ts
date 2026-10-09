import type { EventCategory, EventFilters } from '@/types'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'

export type EventDatePeriod = 'today' | 'tomorrow' | 'week' | 'weekend'

export interface EventFilterState {
  categories: EventCategory[]
  datePeriod?: EventDatePeriod
  is_free?: boolean
  searchQuery: string
  page: number
}

const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City'

export function createEmptyEventFilterState(): EventFilterState {
  return { categories: [], searchQuery: '', page: 1 }
}

function mexicoCityDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  }
}

function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0')].join('-')
}

function formatDateKey(date: Date): string {
  const { year, month, day } = mexicoCityDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getEventDateRange(
  period?: EventDatePeriod,
  now = new Date()
): Pick<EventFilters, 'start_date' | 'end_date'> | Record<string, never> {
  if (!period) return {}

  const today = formatDateKey(now)
  const [year, month, day] = today.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  let startOffset = 0
  let endOffset = 0

  if (period === 'tomorrow') {
    startOffset = 1
    endOffset = 1
  } else if (period === 'week') {
    endOffset = 6
  } else if (period === 'weekend') {
    startOffset = weekday === 0 ? -1 : (6 - weekday + 7) % 7
    endOffset = startOffset + 1
  }

  return {
    start_date: addCalendarDays(today, startOffset),
    end_date: addCalendarDays(today, endOffset),
  }
}

export function getEventDateKey(isoDateTime: string): string {
  return formatDateKey(new Date(isoDateTime))
}

export function getEventDateGroupLabel(dateKey: string, now = new Date()): string {
  const today = formatDateKey(now)
  if (dateKey === today) return 'Hoy'
  if (dateKey === addCalendarDays(today, 1)) return 'Mañana'

  const [year, month, day] = dateKey.split('-').map(Number)
  const parts = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(Date.UTC(year, month - 1, day, 12)))
  const weekday = parts.find((part) => part.type === 'weekday')?.value.replace('.', '') ?? ''
  const monthLabel = parts.find((part) => part.type === 'month')?.value.replace('.', '') ?? ''

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${monthLabel}`
}

// Always shows the explicit weekday/day/month + start time (e.g. "Sáb 3 oct · 11:00 hrs").
// Used on the event detail view, where "Hoy"/"Mañana" relative labels would be ambiguous
// once shared outside the list context. End time is intentionally never shown here.
export function formatEventStartLabel(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  const dateParts = new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(date)
  const weekday = dateParts.find((part) => part.type === 'weekday')?.value.replace('.', '') ?? ''
  const day = dateParts.find((part) => part.type === 'day')?.value ?? ''
  const month = dateParts.find((part) => part.type === 'month')?.value.replace('.', '') ?? ''

  const time = new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${month} · ${time} hrs`
}

export function parseEventFilterState(search: string): EventFilterState {
  const params = new URLSearchParams(search)
  const validCategories = new Set(Object.keys(EVENT_CATEGORY_LABELS))
  const categories = (params.get('categories') ?? params.get('category') ?? '')
    .split(',')
    .filter((category): category is EventCategory => validCategories.has(category))
  const period = params.get('date')
  const validPeriods: EventDatePeriod[] = ['today', 'tomorrow', 'week', 'weekend']
  const requestedPage = Number(params.get('page'))

  return {
    categories: [...new Set(categories)],
    datePeriod: validPeriods.includes(period as EventDatePeriod) ? period as EventDatePeriod : undefined,
    is_free: params.get('is_free') === 'true' ? true : undefined,
    searchQuery: params.get('search') ?? '',
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  }
}

export function writeEventFilterState(
  state: EventFilterState,
  mode: 'push' | 'replace' = 'push'
): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams()
  if (state.categories.length) params.set('categories', state.categories.join(','))
  if (state.datePeriod) params.set('date', state.datePeriod)
  if (state.is_free) params.set('is_free', 'true')
  if (state.searchQuery) params.set('search', state.searchQuery)
  if (state.page > 1) params.set('page', String(state.page))

  const query = params.toString()
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  const write = mode === 'replace' ? window.history.replaceState : window.history.pushState
  write.call(window.history, window.history.state, '', url)
}

export function toEventApiFilters(
  state: EventFilterState,
  pageSize = 12
): EventFilters & { categories?: string } {
  return {
    status: 'published',
    ordering: 'start_datetime',
    page: state.page,
    page_size: pageSize,
    search: state.searchQuery.trim() || undefined,
    categories: state.categories.length ? state.categories.join(',') : undefined,
    is_free: state.is_free,
    ...getEventDateRange(state.datePeriod),
  }
}