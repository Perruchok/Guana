'use client'
// components/events/EventModal.tsx

import Image from 'next/image'
import Link from 'next/link'
import type { Event } from '@/types'
import { formatPrice, mapsLink, shareEvent } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
import CategoryBadge from '@/components/ui/CategoryBadge'
import { useEffect } from 'react'

interface Props {
  event: Event | null
  onClose: () => void
}

export default function EventModal({ event, onClose }: Props) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!event) return null

  const price = formatPrice(event.price, event.is_free)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-modal bg-brand-dark rounded-xl w-[90%] max-w-[620px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-brand-navy px-6 py-5 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <CategoryBadge category={event.category} />
            <h2 className="font-bold text-2xl leading-tight text-white mt-2">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative w-full h-48 bg-slate-800 mb-6 flex items-center justify-center overflow-hidden">
          {event.image ? (
            <Image src={event.image} alt={event.title} fill className="object-cover" />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C4B8A4" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 px-6">{event.description}</p>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 px-6">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Fecha</p>
            <p className="text-sm font-medium text-white">{formatDate(event.start_datetime)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Hora</p>
            <p className="text-sm font-medium text-white">{formatTime(event.start_datetime)} hrs</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Lugar</p>
            <p className="text-sm font-medium text-white">{event.venue_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Entrada</p>
            <p className="text-sm font-medium text-white">{price}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-700 px-6 pb-6">
          <a
            href={mapsLink({ name: event.venue_name, address: '', city: 'Guanajuato' })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            ¿Cómo llegar?
          </a>

          <button
            onClick={() => shareEvent(event.title, window.location.href)}
            className="flex items-center gap-2 border border-slate-600 text-slate-300 hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Compartir
          </button>

          <Link
            href={`/lugares/${event.venue_slug}`}
            onClick={onClose}
            className="ml-auto flex items-center gap-2 border border-slate-600 text-slate-300 hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Ver lugar →
          </Link>
        </div>
      </div>
    </div>
  )
}
