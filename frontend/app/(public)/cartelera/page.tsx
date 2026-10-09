import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EventsGrid from '@/components/events/EventsGrid'
import { events } from '@/lib/api'
import type { EventListItem } from '@/types'

export const metadata = {
  title: 'Cartelera — Guana',
  description: 'Explora los eventos culturales proximos en Guanajuato.',
}

async function getCarteleraEvents(): Promise<{ events: EventListItem[]; total: number }> {
  try {
    const result = await events.list(
      {
        status: 'published',
        ordering: 'start_datetime',
        page_size: 12,
      },
      null,
      { cache: 'no-store' }
    )

    return {
      events: result.results ?? [],
      total: result.count,
    }
  } catch (error) {
    console.error('Error loading cartelera events:', error)
    return { events: [], total: 0 }
  }
}

export default async function CarteleraPage() {
  const initialResult = await getCarteleraEvents()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-4 md:px-10 md:pb-16">
          <div className="mb-2 border-t border-slate-300 pt-3 md:mb-8 md:pt-6">
            <h1 className="text-2xl font-extrabold uppercase italic tracking-tight text-brand-blue md:text-4xl">
              Cartelera Cultural
            </h1>
          </div>
          <EventsGrid initialEvents={initialResult.events} initialTotal={initialResult.total} />
        </div>
      </main>
      <Footer />
    </>
  )
}