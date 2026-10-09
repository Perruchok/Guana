'use client'
// components/events/EventDetail.tsx
// Single source of truth for the event detail layout — reused by the full
// page (app/(public)/eventos/[slug]/page.tsx) and the intercepted modal
// (app/(public)/@modal/(.)eventos/[slug]/page.tsx).

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronRight, MapPin, Share2, Ticket, X } from 'lucide-react'
import type { Event } from '@/types'
import CategoryBadge from '@/components/ui/CategoryBadge'
import ShareSheet from '@/components/events/ShareSheet'
import { trackEvent } from '@/lib/analytics'
import { formatEventStartLabel } from '@/lib/event-filters'
import { downloadEventIcs } from '@/lib/ics'
import { formatPrice, mapsLink } from '@/lib/utils'

interface EventDetailProps {
  event: Event
  surface: 'modal' | 'page'
  onClose?: () => void
}

const ICON_BUTTON_CLASSES =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-gray-900'

export default function EventDetail({ event, surface, onClose }: EventDetailProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)

  useEffect(() => {
    trackEvent('event_view', {
      event_id: event.id,
      event_title: event.title,
      category: event.category,
      venue_id: event.venue,
      is_free: event.is_free,
      surface,
    })
    // Only fire once per mounted event detail instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, surface])

  const priceLabel = formatPrice(event.price, event.is_free)
  const directionsUrl = mapsLink({
    name: event.venue_name,
    address: event.venue_address,
    city: 'Guanajuato',
    latitude: event.venue_latitude,
    longitude: event.venue_longitude,
  })

  const handleRegistrationClick = () => {
    trackEvent('registration_click', {
      event_id: event.id,
      is_free: event.is_free,
      price: event.price,
    })
  }

  const handleDirectionsClick = () => {
    trackEvent('directions_click', {
      event_id: event.id,
      venue_id: event.venue,
      venue_name: event.venue_name,
    })
  }

  const handleShareClick = async () => {
    const url = window.location.href
    const canShareNatively = typeof navigator.share === 'function'
    trackEvent('event_share', {
      event_id: event.id,
      share_method: canShareNatively ? 'native' : 'fallback_sheet',
    })

    if (canShareNatively) {
      try {
        await navigator.share({ title: event.title, url })
      } catch {
        // User dismissed the native share sheet — no further action needed.
      }
      return
    }

    setShareSheetOpen(true)
  }

  const handleAddToCalendar = () => {
    trackEvent('calendar_add', { event_id: event.id })
    downloadEventIcs(event)
  }

  const isModal = surface === 'modal'

  return (
    <div className={isModal ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
      <div className={`flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2 ${isModal ? 'pt-[env(safe-area-inset-top)] md:pt-0' : ''}`}>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Cerrar" className={ICON_BUTTON_CLASSES}>
            <X size={20} aria-hidden="true" />
          </button>
        ) : (
          <Link href="/cartelera" aria-label="Volver a la cartelera" className={ICON_BUTTON_CLASSES}>
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => { void handleShareClick() }}
          aria-label="Compartir evento"
          className={ICON_BUTTON_CLASSES}
        >
          <Share2 size={20} aria-hidden="true" />
        </button>
      </div>

      <div className={isModal ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4' : 'px-0 pb-6 pt-4'}>
      <div className="relative h-[40dvh] max-h-[45dvh] w-full overflow-hidden rounded-xl bg-brand-navy">
        {event.image ? (
          <>
            <Image
              src={event.image}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 768px) 100vw, 620px"
              className="scale-110 object-cover blur-xl"
            />
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 620px"
              className="object-contain"
              priority
            />
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CategoryBadge category={event.category} />
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {priceLabel}
        </span>
      </div>

      <h1 className="mt-3 text-xl font-extrabold leading-tight text-gray-900 md:text-2xl">
        {event.title}
      </h1>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-start gap-3 text-sm text-gray-900">
          <CalendarDays size={18} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <span className="flex-1 self-center">{formatEventStartLabel(event.start_datetime)}</span>
          <button
            type="button"
            onClick={handleAddToCalendar}
            aria-label="Agregar al calendario"
            className={`${ICON_BUTTON_CLASSES} -my-2`}
          >
            <CalendarPlus size={18} aria-hidden="true" />
          </button>
        </div>

        <Link
          href={`/lugares/${event.venue_slug}`}
          className="group flex items-center gap-3 text-sm text-gray-900 transition-colors hover:text-brand-blue"
        >
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{event.venue_name}</span>
          <ChevronRight size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-brand-blue" aria-hidden="true" />
        </Link>

        <div className="flex items-start gap-3 text-sm text-gray-900">
          <Ticket size={18} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <span>{priceLabel}</span>
        </div>
      </div>

      {event.description ? (
        <div className="mt-4">
          <p className={descriptionExpanded ? 'text-sm leading-relaxed text-slate-600' : 'line-clamp-4 text-sm leading-relaxed text-slate-600'}>
            {event.description}
          </p>
          <button
            type="button"
            onClick={() => setDescriptionExpanded((value) => !value)}
            className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-blue-light hover:text-brand-blue"
          >
            {descriptionExpanded ? 'Leer menos' : 'Leer más'}
          </button>
        </div>
      ) : null}

      </div>

      <div className="sticky bottom-0 flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {event.registration_url ? (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRegistrationClick}
            className="flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-brand-blue px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
          >
            Registrarme
          </a>
        ) : null}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDirectionsClick}
          className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
            event.registration_url
              ? 'border border-slate-300 bg-white text-gray-900 hover:border-slate-400'
              : 'bg-brand-blue text-white hover:bg-brand-blue-light'
          }`}
        >
          Cómo llegar
        </a>
      </div>

      <ShareSheet
        open={shareSheetOpen}
        title={event.title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        onClose={() => setShareSheetOpen(false)}
      />
    </div>
  )
}
