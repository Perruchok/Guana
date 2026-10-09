import Image from 'next/image'
import Link from 'next/link'
import { formatTime } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import type { EventListItem } from '@/types'

interface EventRowProps {
  event: EventListItem
}

export default function EventRow({ event }: EventRowProps) {
  const categoryLabel = EVENT_CATEGORY_LABELS[event.category] ?? event.category
  const priceLabel = event.is_free ? 'Gratis' : `${formatPrice(event.price, false)} MXN`

  return (
    <Link
      href={`/eventos/${event.slug}`}
      aria-label={`Ver evento ${event.title}`}
      className="group flex min-h-24 items-center gap-3 border-b border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-brand-navy">
        {event.image ? (
          <Image
            src={event.image}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="shrink-0">{formatTime(event.start_datetime)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{categoryLabel}</span>
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 group-hover:text-brand-blue">
          {event.title}
        </h3>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-xs text-slate-500">{event.venue_name}</p>
          <span className="shrink-0 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {priceLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}