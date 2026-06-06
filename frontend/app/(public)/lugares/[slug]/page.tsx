export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { venues, events } from '@/lib/api'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import VenueGallerySection from '@/components/venues/VenueGallerySection'
import VenueMap from '@/components/venues/VenueMap'
import EventsSection from '@/components/venues/EventsSection'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { notFound } from 'next/navigation'
import type { Venue, Event } from '@/types'

function getVenueCategoryClasses(category: string) {
  const palette: Record<string, string> = {
    restaurante: 'bg-brand-blue text-white',
    bar: 'bg-brand-yellow text-gray-900',
    cafe: 'bg-orange-500 text-white',
    hotel: 'bg-indigo-600 text-white',
    galeria: 'bg-violet-600 text-white',
    museo: 'bg-rose-600 text-white',
    teatro: 'bg-brand-slate text-white',
    foro: 'bg-teal-600 text-white',
    espacio: 'bg-green-600 text-white',
    otro: 'bg-brand-slate text-white',
  }

  return palette[category.toLowerCase()] ?? 'bg-brand-slate text-white'
}

async function getVenueBySlug(slug: string): Promise<Venue | null> {
  try {
    const venueListItem = await venues.bySlug(slug, { cache: 'no-store' })
    if (!venueListItem) return null
    // Fetch full venue detail to get address, description, phone, etc.
    return await venues.get(venueListItem.id)
  } catch (error) {
    console.error('Venue fetch error:', error)
    return null
  }
}

async function getVenueEvents(venueId: string): Promise<Event[]> {
  try {
    const res = await events.list({
      venue: venueId,
      status: 'published',
      ordering: 'start_datetime',
    }, null, { cache: 'no-store' })
    // Map EventListItem[] a Event[] con valores vacíos
    return (res.results ?? []).map((item) => ({
      ...item,
      owner: '',
      owner_name: item.owner_name || '',
      venue: venueId,
      venue_name: item.venue_name || '',
      venue_slug: item.venue_slug || '',
      description: '',
      end_datetime: '',
      capacity: null,
      registered_count: 0,
      registration_url: null,
      status: 'published',
      is_upcoming: false,
      is_ongoing: false,
      is_past: false,
      created_at: '',
      updated_at: '',
    }))
  } catch (error) {
    console.error('Error fetching venue events:', error)
    return []
  }
}


export async function generateMetadata({ params }: { params: { slug: string } }) {
  const venue = await getVenueBySlug(params.slug)
  
  return {
    title: venue ? venue.name : 'Lugar no encontrado',
    description: venue ? venue.description : 'No pudimos encontrar el lugar que buscas.',
  }
}

export default async function VenuePage({ params }: { params: { slug: string } }) {
  let venue = null
  try {
    venue = await getVenueBySlug(params.slug)
  } catch (e) {
    console.error('Venue fetch error:', e)
  }
  if (!venue) notFound()

  let venueEvents: Event[] = []
  try {
    venueEvents = await getVenueEvents(venue.id)
  } catch (e) {
    console.error('Error fetching venue events:', e)
  }

  const categoryLabel = VENUE_CATEGORY_LABELS[venue.category] || venue.category
  const galleryImages = venue.image ? [venue.image] : []
  const categoryClasses = getVenueCategoryClasses(venue.category)
  const locationLabel = [venue.address, venue.city].filter(Boolean).join(', ')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <div className="border-t border-slate-300 pt-8">
            <Link
              href="/directorio"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Volver al directorio
            </Link>

            <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${categoryClasses}`}>
                    {categoryLabel}
                  </span>
                  {venue.city && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <MapPin size={12} aria-hidden="true" />
                      {venue.city}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-extrabold uppercase italic tracking-tight text-brand-blue md:text-5xl">
                    {venue.name}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
                    {venue.description || 'Explora este espacio en Guanajuato, revisa su ubicacion y encuentra los eventos que se presentan aqui.'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ubicacion</p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-900">
                      {locationLabel || 'Ubicacion disponible proximamente'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto</p>
                    <div className="mt-3 space-y-3 text-sm text-gray-900">
                      {venue.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-brand-blue" aria-hidden="true" />
                          <span>{venue.phone}</span>
                        </div>
                      ) : null}
                      {venue.email ? (
                        <a
                          href={`mailto:${venue.email}`}
                          className="flex items-center gap-2 text-brand-blue-light transition-colors hover:text-brand-blue"
                        >
                          <Mail size={14} aria-hidden="true" />
                          {venue.email}
                        </a>
                      ) : null}
                      {!venue.phone && !venue.email ? (
                        <p className="text-slate-500">Sin datos de contacto publicados.</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {venue.website ? (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
                    >
                      <Globe size={16} aria-hidden="true" />
                      Visitar sitio web
                    </a>
                  ) : null}
                  {venue.email ? (
                    <a
                      href={`mailto:${venue.email}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-gray-900"
                    >
                      <Mail size={16} aria-hidden="true" />
                      Contactar lugar
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                {venue.image ? (
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={venue.image}
                      alt={venue.name}
                      fill
                      className="object-cover"
                      priority
                      unoptimized={true}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-transparent p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Espacio destacado</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold leading-tight">{venue.name}</p>
                        {venue.website ? (
                          <a
                            href={venue.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-blue transition-colors hover:text-brand-blue-light"
                            aria-label={`Abrir sitio web de ${venue.name}`}
                          >
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center bg-slate-200 p-8 text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sin imagen principal</p>
                      <p className="mt-2 text-sm text-slate-500">Este lugar aun no ha publicado una portada.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="mt-12 space-y-12">
            <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sobre este lugar</p>
                <p className="mt-4 text-sm leading-relaxed text-gray-900 md:text-base">
                  {venue.description || 'Este perfil se actualizara pronto con mas informacion sobre la experiencia, la programacion y los servicios de este lugar.'}
                </p>
              </div>
            </section>

            <VenueGallerySection images={galleryImages} venueOwnerId={venue.owner} />

            {venueEvents.length > 0 && (
              <EventsSection events={venueEvents} />
            )}

            <VenueMap
              address={venue.address}
              city={venue.city}
              venueName={venue.name}
              latitude={venue.latitude}
              longitude={venue.longitude}
            />
          </div>
        </div>

        {(venue.email || venue.website) && (
          <div className="mt-16 border-t border-slate-300 bg-white/70 px-6 py-8 backdrop-blur-sm md:px-10">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Siguiente paso</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">Conecta con {venue.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                {venue.email && (
                  <a
                    href={`mailto:${venue.email}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-gray-900"
                  >
                    <Mail size={16} aria-hidden="true" />
                    Escribir al lugar
                  </a>
                )}
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
                  >
                    <ArrowUpRight size={16} aria-hidden="true" />
                    Visitar sitio web
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
