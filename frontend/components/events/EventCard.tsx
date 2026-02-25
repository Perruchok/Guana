// components/events/EventCard.tsx
import Image from 'next/image'
import type { EventListItem } from '@/types'
import { EVENT_CATEGORY_LABELS, EVENT_TAG_CLASSES, formatPrice } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'

interface Props {
  event: EventListItem
  onClick: (event: EventListItem) => void
}

export default function EventCard({ event, onClick }: Props) {
  const label    = EVENT_CATEGORY_LABELS[event.category]
  const tagClass = EVENT_TAG_CLASSES[event.category]
  const price    = formatPrice(event.price, event.is_free)

  return (
    <article
      onClick={() => onClick(event)}
      className="border border-border rounded-sm overflow-hidden bg-white cursor-pointer
                 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
    >
      {/* Image */}
      <div className="relative w-full h-40 bg-pale flex items-center justify-center">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4B8A4" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`font-mono-gk text-[0.6rem] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium ${tagClass}`}>
            {label}
          </span>
          <span className="text-[0.65rem] text-stone">{price}</span>
        </div>

        <h3 className="font-display font-bold text-[1rem] leading-snug text-ink mb-2 group-hover:text-terracota transition-colors">
          {event.title}
        </h3>

        <p className="font-mono-gk text-[0.65rem] text-stone tracking-wide">
          {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)} hrs
        </p>

        <p className="text-xs text-stone mt-1">{event.venue_name}</p>
      </div>
    </article>
  )
}
