// components/events/EventCard.tsx
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import CategoryBadge from '@/components/ui/CategoryBadge'

interface EventCardProps {
  id: string
  title: string
  category: string
  startDatetime: string
  venueName: string
  imageUrl: string | null
  slug: string
  isFree: boolean
  price: number
  onClick: () => void
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function getDateParts(startDatetime: string): { day: string; month: string } {
  const match = startDatetime.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) {
    return { day: '--', month: '---' }
  }

  const [, , monthValue, dayValue] = match
  const monthIndex = Number.parseInt(monthValue, 10) - 1

  if (monthIndex < 0 || monthIndex >= MONTHS_ES.length) {
    return { day: dayValue, month: '---' }
  }

  return {
    day: String(Number.parseInt(dayValue, 10)),
    month: MONTHS_ES[monthIndex],
  }
}

export default function EventCard({
  id,
  title,
  category,
  startDatetime,
  venueName,
  imageUrl,
  slug,
  isFree,
  price,
  onClick,
}: EventCardProps) {
  const { day, month } = getDateParts(startDatetime)
  const priceLabel = isFree ? 'Gratis' : `MXN ${price.toLocaleString('es-MX')}`

  return (
    <article
      id={id}
      onClick={onClick}
      aria-label={`Ver evento ${title}`}
      className="block rounded-xl bg-brand-dark overflow-hidden transition-transform duration-200 hover:scale-[1.02] cursor-pointer h-full"
    >
        <div className="relative aspect-video bg-gray-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gray-800" aria-hidden="true" />
          )}

          <div className="absolute left-3 top-3">
            <CategoryBadge category={category} />
          </div>

          <div className="absolute bottom-3 left-3 rounded bg-slate-800/80 px-2 py-1 text-white backdrop-blur">
            <div className="text-lg font-bold leading-none">{day}</div>
            <div className="text-xs uppercase leading-none">{month}</div>
          </div>
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">{title}</h3>

          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} aria-hidden="true" />
            <span className="truncate">{venueName}</span>
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm font-semibold ${isFree ? 'text-green-400' : 'text-white'}`}>
              {priceLabel}
            </span>
            <span className="text-xs text-brand-blue-light transition-colors hover:text-brand-blue">Ver mas »</span>
          </div>
        </div>
    </article>
  )
}
