'use client'
// components/events/FilterModal.tsx

import { useEffect, useState } from 'react'
import type { EventCategory, EventFilters } from '@/types'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  open: boolean
  current: EventFilters
  onApply: (filters: EventFilters) => void
  onClose: () => void
}

const CATEGORIES: EventCategory[] = [
  'music', 'performance', 'cinema', 'workshop',
  'exhibition', 'dance', 'art', 'literature',
  'festival', 'conference', 'other',
]

const DATE_OPTIONS = [
  { label: 'Hoy',             value: 'today' },
  { label: 'Mañana',          value: 'tomorrow' },
  { label: 'Esta semana',     value: 'week' },
  { label: 'Fin de semana',   value: 'weekend' },
]

export default function FilterModal({ open, current, onApply, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | undefined>(current.category)
  const [selectedDate, setSelectedDate]         = useState<string | undefined>()
  const [isFree, setIsFree]                     = useState<boolean | undefined>(current.is_free)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      is_free:  isFree,
      // Date filtering: when you wire the real API, convert selectedDate → date range params
    })
    onClose()
  }

  const handleClear = () => {
    setSelectedCategory(undefined)
    setSelectedDate(undefined)
    setIsFree(undefined)
    onApply({})
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-modal bg-cream border border-border rounded-sm w-[90%] max-w-[540px] max-h-[90vh] overflow-y-auto p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl">Filtrar eventos</h2>
            <p className="text-xs text-stone mt-1">Combina los filtros que quieras.</p>
          </div>
          <button onClick={onClose} className="text-stone hover:text-terracota transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category */}
        <div className="mb-6">
          <p className="label mb-3">Tipo de evento</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors
                  ${selectedCategory === cat
                    ? 'bg-ink text-cream border-ink'
                    : 'border-border text-ink hover:border-terracota hover:text-terracota'
                  }`}
              >
                {EVENT_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <p className="label mb-3">Fechas</p>
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSelectedDate(selectedDate === value ? undefined : value)}
                className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors
                  ${selectedDate === value
                    ? 'bg-ink text-cream border-ink'
                    : 'border-border text-ink hover:border-terracota hover:text-terracota'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Free only */}
        <div className="mb-6">
          <p className="label mb-3">Precio</p>
          <button
            onClick={() => setIsFree(isFree === true ? undefined : true)}
            className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors
              ${isFree
                ? 'bg-ink text-cream border-ink'
                : 'border-border text-ink hover:border-terracota hover:text-terracota'
              }`}
          >
            Solo eventos gratuitos
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-5 border-t border-border">
          <button
            onClick={handleClear}
            className="flex-1 border border-border text-xs font-medium uppercase tracking-wider py-2 rounded-sm hover:bg-pale transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] bg-terracota text-cream text-xs font-medium uppercase tracking-wider py-2 rounded-sm hover:bg-[#a84e23] transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  )
}
