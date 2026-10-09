// components/events/EventCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import CategoryBadge from '@/components/ui/CategoryBadge'
import { formatDateTime } from '@/lib/auth'

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
  href: string
}

export default function EventCard({
  id,
  title,
  category,
  startDatetime,
  venueName,
  imageUrl,
  isFree,
  price,
  href,
}: EventCardProps) {
  const priceLabel = isFree ? 'Gratis' : `MXN ${price.toLocaleString('es-MX')}`
  const cardClassName = 'block h-full cursor-pointer overflow-hidden rounded-xl bg-brand-dark transition-transform duration-200 hover:scale-[1.02]'

  return (
    <Link id={id} href={href} aria-label={`Ver evento ${title}`} className={cardClassName}>
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

      </div>

      <div className="p-3">
        <p className="mb-1 text-xs font-medium text-slate-400">{formatDateTime(startDatetime)}</p>
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
    </Link>
  )
}
