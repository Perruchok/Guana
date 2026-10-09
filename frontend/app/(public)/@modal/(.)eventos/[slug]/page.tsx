// app/(public)/@modal/(.)eventos/[slug]/page.tsx
// Intercepts in-app navigation to /eventos/[slug] from sibling routes inside
// (public) (home, cartelera, directorio, venue profiles) and renders the
// event detail inside a Sheet instead of a full page navigation.

import { notFound } from 'next/navigation'
import { events } from '@/lib/api'
import EventDetailModal from '@/components/events/EventDetailModal'
import type { Event } from '@/types'

async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    return await events.getDetailBySlug(slug, { cache: 'no-store' })
  } catch (error) {
    console.error('Event fetch error:', error)
    return null
  }
}

export default async function InterceptedEventModal({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  return <EventDetailModal event={event} />
}
