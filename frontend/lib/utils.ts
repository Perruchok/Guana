// ─────────────────────────────────────────────
// lib/utils.ts
// Shared display helpers and label maps.
// ─────────────────────────────────────────────

import type { EventCategory, VenueCategory } from '@/types'

// ── Category labels ───────────────────────────

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  exhibition:  'Exposición',
  performance: 'Artes Escénicas',
  workshop:    'Taller',
  conference:  'Conferencia',
  festival:    'Festival',
  cinema:      'Cine',
  music:       'Música',
  theater:     'Teatro',
  dance:       'Danza',
  art:         'Arte',
  literature:  'Literatura',
  other:       'Otro',
}

export const VENUE_CATEGORY_LABELS: Record<VenueCategory, string> = {
  museum:          'Museo',
  gallery:         'Galería',
  theater:         'Teatro',
  cinema:          'Cine',
  cafe:            'Café / Bar',
  cultural_center: 'Centro Cultural',
  library:         'Biblioteca',
  market:          'Mercado',
  public_space:    'Espacio Público',
  other:           'Otro',
}

// ── Tag color map ─────────────────────────────
// Maps event category → Tailwind classes

export const EVENT_TAG_CLASSES: Record<EventCategory, string> = {
  music:       'bg-amber-50  text-amber-800',
  theater:     'bg-green-50  text-green-800',
  cinema:      'bg-blue-50   text-blue-800',
  workshop:    'bg-orange-50 text-orange-800',
  exhibition:  'bg-purple-50 text-purple-800',
  performance: 'bg-pink-50   text-pink-800',
  dance:       'bg-rose-50   text-rose-800',
  art:         'bg-violet-50 text-violet-800',
  literature:  'bg-teal-50   text-teal-800',
  festival:    'bg-yellow-50 text-yellow-800',
  conference:  'bg-slate-50  text-slate-700',
  other:       'bg-stone-50  text-stone-600',
}

// ── Google Maps link builder ───────────────────

export function mapsLink(venue: { name: string; address: string; city: string }): string {
  const query = encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

// ── Share helper ──────────────────────────────

export async function shareEvent(title: string, url: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({ title, url })
  } else {
    await navigator.clipboard.writeText(url)
    alert('¡Enlace copiado al portapapeles!')
  }
}

// ── Price display ─────────────────────────────

export function formatPrice(price: number, isFree: boolean): string {
  if (isFree || price === 0) return 'Entrada libre'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(price)
}
