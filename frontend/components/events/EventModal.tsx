'use client'
// components/events/EventModal.tsx

import Image from 'next/image'
import Link from 'next/link'
import type { Event } from '@/types'
import { EVENT_CATEGORY_LABELS, EVENT_TAG_CLASSES, formatPrice, mapsLink, shareEvent } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
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

  const label    = EVENT_CATEGORY_LABELS[event.category]
  const tagClass = EVENT_TAG_CLASSES[event.category]
  const price    = formatPrice(event.price, event.is_free)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-modal bg-cream border border-border rounded-sm w-[90%] max-w-[620px] max-h-[90vh] overflow-y-auto p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <span className={`font-mono-gk text-[0.6rem] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium inline-block mb-2 ${tagClass}`}>
              {label}
            </span>
            <h2 className="font-display font-bold text-2xl leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone hover:text-terracota transition-colors shrink-0 p-1"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative w-full h-48 bg-pale rounded-sm mb-6 flex items-center justify-center overflow-hidden">
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
        <p className="text-sm text-stone leading-relaxed mb-6">{event.description}</p>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="label mb-1">Fecha</p>
            <p className="text-sm font-medium">{formatDate(event.start_datetime)}</p>
          </div>
          <div>
            <p className="label mb-1">Hora</p>
            <p className="text-sm font-medium">{formatTime(event.start_datetime)} hrs</p>
          </div>
          <div>
            <p className="label mb-1">Lugar</p>
            <p className="text-sm font-medium">{event.venue_name}</p>
          </div>
          <div>
            <p className="label mb-1">Entrada</p>
            <p className="text-sm font-medium">{price}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
          <a
            href={mapsLink({ name: event.venue_name, address: '', city: 'Guanajuato' })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-sage text-sage text-xs font-medium px-4 py-2 rounded-sm hover:bg-sage hover:text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            ¿Cómo llegar?
          </a>

          <button
            onClick={() => shareEvent(event.title, window.location.href)}
            className="flex items-center gap-2 border border-border text-stone text-xs font-medium px-4 py-2 rounded-sm hover:border-ink hover:text-ink transition-colors"
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
            className="ml-auto flex items-center gap-2 bg-terracota text-cream text-xs font-medium px-4 py-2 rounded-sm hover:bg-[#a84e23] transition-colors"
          >
            Ver lugar →
          </Link>
        </div>
      </div>
    </div>
  )
}
