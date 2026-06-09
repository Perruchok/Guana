import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EventsGrid, { type Event as EventsGridEvent } from '@/components/events/EventsGrid'
import { events } from '@/lib/api'
import type { EventListItem } from '@/types'

export const metadata = {
  title: 'Cartelera — Guana',
  description: 'Explora los eventos culturales proximos en Guanajuato.',
}

async function getCarteleraEvents(): Promise<EventsGridEvent[]> {
  try {
    const result = await events.list(
      {
        status: 'published',
        ordering: 'start_datetime',
      },
      null,
      { cache: 'no-store' }
    )

    return ((result.results ?? []) as EventListItem[]).map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      startDatetime: event.start_datetime,
      venueName: event.venue_name,
      imageUrl: event.image,
      slug: event.slug,
      isFree: event.is_free,
      price: event.price,
    }))
  } catch (error) {
    console.error('Error loading cartelera events:', error)
    return []
  }
}

export default async function CarteleraPage() {
  const initialEvents = await getCarteleraEvents()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <div className="mb-10 border-t border-slate-300 pt-6 text-center">
            <h1 className="text-4xl font-extrabold uppercase italic tracking-tight text-brand-blue md:text-5xl">
              Cartelera
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-tight text-slate-500 md:text-base">
              Consulta la agenda cultural y abre el detalle completo de cada evento.
            </p>
          </div>

          <EventsGrid events={initialEvents} isLoading={false} />
        </div>
      </main>
      <Footer />
    </>
  )
}