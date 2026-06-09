export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Ticket } from 'lucide-react'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { events } from '@/lib/api'
import { formatDateTime } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import type { Event } from '@/types'

async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const eventListItem = await events.getBySlug(slug, { cache: 'no-store' })

    if (!eventListItem) {
      return null
    }

    return await events.get(eventListItem.id)
  } catch (error) {
    console.error('Event fetch error:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

  return {
    title: event ? `${event.title} — Guana` : 'Evento no encontrado',
    description: event ? event.description : 'No pudimos encontrar el evento que buscas.',
  }
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  const categoryLabel = EVENT_CATEGORY_LABELS[event.category] ?? event.category
  const priceLabel = formatPrice(event.price, event.is_free)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <div className="border-t border-slate-300 pt-8">
            <Link
              href="/cartelera"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Volver a la cartelera
            </Link>

            <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin size={12} aria-hidden="true" />
                    {event.venue_name}
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-extrabold uppercase italic tracking-tight text-brand-blue md:text-5xl">
                    {event.title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
                    {event.description}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha y hora</p>
                    <div className="mt-3 flex items-start gap-3 text-sm text-gray-900">
                      <CalendarDays size={16} className="mt-0.5 text-brand-blue" aria-hidden="true" />
                      <div>
                        <p>{formatDateTime(event.start_datetime)}</p>
                        {event.end_datetime && event.end_datetime !== event.start_datetime ? (
                          <p className="mt-1 text-slate-500">Termina: {formatDateTime(event.end_datetime)}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entrada</p>
                    <div className="mt-3 flex items-start gap-3 text-sm text-gray-900">
                      <Ticket size={16} className="mt-0.5 text-brand-blue" aria-hidden="true" />
                      <div>
                        <p>{priceLabel}</p>
                        {event.capacity ? (
                          <p className="mt-1 text-slate-500">Cupo: {event.capacity} personas</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/lugares/${event.venue_slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
                  >
                    Ver lugar
                  </Link>

                  {event.registration_url ? (
                    <a
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-gray-900"
                    >
                      Registrarme
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                {event.image ? (
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-slate-200 p-8 text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sin imagen principal</p>
                      <p className="mt-2 text-sm text-slate-500">Este evento aun no ha publicado una portada.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}