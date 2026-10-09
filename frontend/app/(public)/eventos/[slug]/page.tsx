export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EventDetail from '@/components/events/EventDetail'
import { events } from '@/lib/api'
import { absoluteUrl } from '@/lib/utils'
import type { Event } from '@/types'

async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    return await events.getDetailBySlug(slug, { cache: 'no-store' })
  } catch (error) {
    console.error('Event fetch error:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    return {
      title: 'Evento no encontrado',
      description: 'No pudimos encontrar el evento que buscas.',
    }
  }

  const canonicalUrl = absoluteUrl(`/eventos/${event.slug}`)
  const imageUrl = event.image ? absoluteUrl(event.image) : undefined

  return {
    title: event.title,
    description: event.description || `Evento en ${event.venue_name}, Guanajuato.`,
    openGraph: {
      title: event.title,
      description: event.description || `Evento en ${event.venue_name}, Guanajuato.`,
      url: canonicalUrl,
      locale: 'es_MX',
      type: 'website',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-2xl px-4 pb-0 pt-2 md:px-10 md:pb-16">
          <EventDetail event={event} surface="page" />
        </div>
      </main>
      <Footer />
    </>
  )
}
