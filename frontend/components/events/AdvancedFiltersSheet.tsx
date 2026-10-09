'use client'

import { useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'
import type { EventFilterState, EventDatePeriod } from '@/lib/event-filters'
import type { EventCategory } from '@/types'

interface AdvancedFiltersSheetProps {
  open: boolean
  current: EventFilterState
  onApply: (filters: EventFilterState) => void
  onClose: () => void
}

const CATEGORIES = Object.keys(EVENT_CATEGORY_LABELS) as EventCategory[]
const DATE_OPTIONS: Array<{ label: string; value: EventDatePeriod }> = [
  { label: 'Hoy', value: 'today' },
  { label: 'Mañana', value: 'tomorrow' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este fin de semana', value: 'weekend' },
]

export default function AdvancedFiltersSheet({
  open,
  current,
  onApply,
  onClose,
}: AdvancedFiltersSheetProps) {
  const [categories, setCategories] = useState<EventCategory[]>(current.categories)
  const [datePeriod, setDatePeriod] = useState<EventDatePeriod | undefined>(current.datePeriod)
  const [isFree, setIsFree] = useState(Boolean(current.is_free))

  useEffect(() => {
    if (!open) return
    setCategories(current.categories)
    setDatePeriod(current.datePeriod)
    setIsFree(Boolean(current.is_free))
  }, [open, current])

  const toggleCategory = (category: EventCategory) => {
    setCategories((selected) => selected.includes(category)
      ? selected.filter((value) => value !== category)
      : [...selected, category])
  }

  const apply = () => {
    onApply({
      ...current,
      categories,
      datePeriod,
      is_free: isFree ? true : undefined,
      page: 1,
    })
    onClose()
  }

  return (
    <Sheet open={open} title="Filtros avanzados" onClose={onClose}>
      <div className="space-y-6 py-5">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-900">Tipo de evento</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const selected = categories.includes(category)
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={`min-h-11 rounded-md border px-3 text-xs font-semibold transition-colors ${selected
                    ? 'border-blue-200 bg-blue-100 text-blue-800'
                    : 'border-slate-300 bg-white text-gray-700 hover:border-slate-400'
                  }`}
                >
                  {EVENT_CATEGORY_LABELS[category]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-900">Fecha</legend>
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map(({ label, value }) => {
              const selected = datePeriod === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDatePeriod(selected ? undefined : value)}
                  className={`min-h-11 rounded-md border px-3 text-xs font-semibold transition-colors ${selected
                    ? 'border-blue-200 bg-blue-100 text-blue-800'
                    : 'border-slate-300 bg-white text-gray-700 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-900">Precio</legend>
          <button
            type="button"
            aria-pressed={isFree}
            onClick={() => setIsFree((value) => !value)}
            className={`min-h-11 rounded-md border px-3 text-xs font-semibold transition-colors ${isFree
              ? 'border-blue-200 bg-blue-100 text-blue-800'
              : 'border-slate-300 bg-white text-gray-700 hover:border-slate-400'
            }`}
          >
            Solo eventos gratuitos
          </button>
        </fieldset>

        <div className="flex gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => {
              setCategories([])
              setDatePeriod(undefined)
              setIsFree(false)
            }}
            className="min-h-11 rounded-md px-4 text-sm font-semibold text-slate-500 hover:text-gray-700"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={apply}
            className="min-h-11 flex-1 rounded-md bg-brand-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </Sheet>
  )
}