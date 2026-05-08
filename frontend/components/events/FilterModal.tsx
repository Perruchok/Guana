'use client'
// components/events/FilterModal.tsx

import { useEffect, useState } from 'react'
import type { EventCategory, EventFilters } from '@/types'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'

type EventUiFilters = EventFilters & {
  categories?: EventCategory[]
}

interface Props {
  open: boolean
  current: EventUiFilters
  onApply: (filters: EventUiFilters) => void
  onClose: () => void
}

const CATEGORIES: EventCategory[] = [
  'music', 'performance', 'cinema', 'workshop',
  'exhibition', 'dance', 'theater', 'art', 'literature',
  'festival', 'conference', 'other',
]

const DATE_OPTIONS = [
  { label: 'Hoy',             value: 'today' },
  { label: 'Mañana',          value: 'tomorrow' },
  { label: 'Esta semana',     value: 'week' },
  { label: 'Fin de semana',   value: 'weekend' },
]

export default function FilterModal({ open, current, onApply, onClose }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    current.categories ?? (current.category ? [current.category] : [])
  )
  const [selectedDate, setSelectedDate]         = useState<string | undefined>()
  const [isFree, setIsFree]                     = useState<boolean | undefined>(current.is_free)

  useEffect(() => {
    if (!open) return
    setSelectedCategories(current.categories ?? (current.category ? [current.category] : []))
    setIsFree(current.is_free)
  }, [open, current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleApply = () => {
    onApply({
      category: undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      is_free:  isFree,
      // Date filtering: when you wire the real API, convert selectedDate → date range params
    })
    onClose()
  }

  const handleClear = () => {
    setSelectedCategories([])
    setSelectedDate(undefined)
    setIsFree(undefined)
    onApply({ category: undefined, categories: undefined, is_free: undefined })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-modal bg-white rounded-xl w-[90%] max-w-[540px] max-h-[90vh] overflow-y-auto p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Filtrar eventos</h2>
            <p className="text-xs text-gray-700 mt-1">Combina los filtros que quieras.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-gray-700 transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-gray-900">Tipo de evento</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategories((currentCategories) =>
                    currentCategories.includes(cat)
                      ? currentCategories.filter((value) => value !== cat)
                      : [...currentCategories, cat]
                  )
                }}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors
                  ${selectedCategories.includes(cat)
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'border-slate-300 text-gray-700 hover:border-slate-400'
                  }`}
              >
                {EVENT_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-gray-900">Fechas</p>
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSelectedDate(selectedDate === value ? undefined : value)}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors
                  ${selectedDate === value
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'border-slate-300 text-gray-700 hover:border-slate-400'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Free only */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-gray-900">Precio</p>
          <button
            onClick={() => setIsFree(isFree === true ? undefined : true)}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors
              ${isFree
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'border-slate-300 text-gray-700 hover:border-slate-400'
              }`}
          >
            Solo eventos gratuitos
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 text-xs font-medium py-2 rounded-lg text-slate-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] bg-brand-blue text-white text-xs font-medium py-2 rounded-lg hover:bg-brand-blue-light transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  )
}
