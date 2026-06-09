'use client'

import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types'

interface EventsSectionProps {
  events: Event[]
}

export default function EventsSection({ events }: EventsSectionProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agenda</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Proximos eventos</h2>
        </div>

        <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <div className="flex min-w-min gap-4 pb-4 md:min-w-full md:grid md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="w-80 flex-shrink-0 cursor-pointer md:w-auto md:flex-shrink"
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
                  href={`/eventos/${event.slug}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
