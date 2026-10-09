'use client'

import type { EventFilterState } from '@/lib/event-filters'

interface FilterChipsProps {
  filters: EventFilterState
  onChange: (filters: EventFilterState) => void
}

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
  const quickChipClass = (active: boolean) =>
    `inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors ${
      active
        ? 'bg-brand-blue text-white'
        : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-gray-800'
    }`

  return (
    <div className="hide-scrollbar overflow-x-auto" role="group" aria-label="Filtros rápidos">
      <div className="flex w-max min-w-full gap-2 pb-1">
        <button
          type="button"
          aria-pressed={filters.datePeriod === 'today'}
          onClick={() => onChange({ ...filters, datePeriod: filters.datePeriod === 'today' ? undefined : 'today', page: 1 })}
          className={quickChipClass(filters.datePeriod === 'today')}
        >
          Hoy
        </button>
        <button
          type="button"
          aria-pressed={filters.datePeriod === 'week'}
          onClick={() => onChange({ ...filters, datePeriod: filters.datePeriod === 'week' ? undefined : 'week', page: 1 })}
          className={quickChipClass(filters.datePeriod === 'week')}
        >
          Esta semana
        </button>
        <button
          type="button"
          aria-pressed={filters.datePeriod === 'weekend'}
          onClick={() => onChange({ ...filters, datePeriod: filters.datePeriod === 'weekend' ? undefined : 'weekend', page: 1 })}
          className={quickChipClass(filters.datePeriod === 'weekend')}
        >
          Este fin de semana
        </button>
        <button
          type="button"
          aria-pressed={Boolean(filters.is_free)}
          onClick={() => onChange({ ...filters, is_free: filters.is_free ? undefined : true, page: 1 })}
          className={quickChipClass(Boolean(filters.is_free))}
        >
          Gratis
        </button>
      </div>
    </div>
  )
}