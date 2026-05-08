'use client'

import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types'

interface EventsSectionProps {
  events: Event[]
}

export default function EventsSection({ events }: EventsSectionProps) {
  return (
    <>
      <div className="space-y-4">
        <h2 className="font-display font-black text-2xl text-ink">
          Próximos eventos
        </h2>

        <div className="overflow-x-auto hide-scrollbar -mx-6 md:mx-0 px-6 md:px-0">
          <div className="flex gap-4 pb-4 min-w-min md:min-w-full md:grid md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="w-80 md:w-auto flex-shrink-0 md:flex-shrink cursor-pointer"
              >
                <EventCard
                  id={event.id}
                  title={event.title}
                  category={event.category}
                  startDatetime={event.start_datetime}
                  venueName={event.venue_name}
                  imageUrl={event.image}
                  slug={event.slug}
                  isFree={event.is_free}
                  price={event.price}
                  onClick={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
