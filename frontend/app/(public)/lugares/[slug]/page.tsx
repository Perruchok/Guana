import Link from 'next/link'
import Image from 'next/image'
import { venues, events, API_BASE_URL } from '@/lib/api'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import VenueGallerySection from '@/components/venues/VenueGallerySection'
import VenueMap from '@/components/venues/VenueMap'
import EventsSection from '@/components/venues/EventsSection'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { Venue, Event } from '@/types'

async function getVenueBySlug(slug: string): Promise<Venue | null> {
  try {
    // First, search for the venue by slug
    const searchRes = await fetch(`${API_BASE_URL}/venues/?search=${encodeURIComponent(slug)}`)
    if (!searchRes.ok) return null
    
    const searchData = await searchRes.json()
    if (!searchData.results || searchData.results.length === 0) return null
    
    const venueListItem = searchData.results[0]
    
    // Then get the full venue data
    const venueRes = await fetch(`${API_BASE_URL}/venues/${venueListItem.id}/`)
    if (!venueRes.ok) return null
    
    return await venueRes.json()
  } catch (error) {
    console.error('Error fetching venue:', error)
    return null
  }
}

async function getVenueEvents(venueId: string): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/?venue=${venueId}&status=published&ordering=start_datetime`)
    if (!res.ok) return []
    
    const data = await res.json()
    return data.results ?? []
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

export default async function VenuePage({
  params,
}: {
  params: { slug: string }
}) {
  const venue = await getVenueBySlug(params.slug)

  if (!venue) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-6 bg-cream">
          <div className="text-center">
            <h1 className="font-display font-black text-4xl text-ink mb-2">
              Lugar no encontrado
            </h1>
            <p className="text-stone text-lg mb-6">
              No pudimos encontrar el lugar que buscas.
            </p>
            <Link
              href="/directorio"
              className="inline-flex items-center gap-2 text-terracota hover:underline font-medium"
            >
              ← Ver directorio
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const venueEvents = await getVenueEvents(venue.id)
  const categoryLabel = VENUE_CATEGORY_LABELS[venue.category] || venue.category

  // Prepare gallery images (currently only one image field)
  const galleryImages = venue.image ? [venue.image] : []

  return (
    <>
      <Navbar />

      <main className="bg-cream min-h-screen">
        {/* SECTION 1: HERO HEADER */}
        {venue.image ? (
          <div className="relative w-full h-80 md:h-96 overflow-hidden">
            <Image
              src={venue.image}
              alt={venue.name}
              fill
              className="object-cover"
              priority
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            
            {/* Venue name + category overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h1 className="font-display font-black text-3xl md:text-4xl text-white mb-2">
                {venue.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex px-3 py-1 bg-terracota/90 text-cream text-xs font-semibold rounded-sm">
                  {categoryLabel}
                </span>
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0l-6 6m6-6v12" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-pale border-b border-border">
            <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
              <h1 className="font-display font-black text-4xl text-ink mb-3">
                {venue.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex px-3 py-1 bg-terracota text-cream text-xs font-semibold rounded-sm">
                  {categoryLabel}
                </span>
                <span className="text-stone text-sm">{venue.city}</span>
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracota hover:underline text-sm font-medium inline-flex items-center gap-1"
                  >
                    Sitio web
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0l-6 6m6-6v12" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main content container */}
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 space-y-16">
          {/* SECTION 2: VENUE INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column: Description + contact in text */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="font-mono-gk text-sm text-stone uppercase tracking-wide">
                Sobre este lugar
              </h2>
              <p className="text-ink leading-relaxed">
                {venue.description}
              </p>

              {/* Contact items as text list */}
              <div className="space-y-2 mt-6 pt-6 border-t border-pale">
                {venue.phone && (
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <svg className="w-4 h-4 text-terracota flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.346.611.901 1.465 1.87 2.434s1.823 1.524 2.434 1.87l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a2 2 0 01-2 2h-2.5A7.5 7.5 0 012 9.5V3z" />
                    </svg>
                    {venue.phone}
                  </div>
                )}
                {venue.email && (
                  <a
                    href={`mailto:${venue.email}`}
                    className="flex items-center gap-2 text-sm text-terracota hover:underline"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {venue.email}
                  </a>
                )}
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-terracota hover:underline"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0l-6 6m6-6v12" />
                    </svg>
                    Sitio web
                  </a>
                )}
              </div>
            </div>

            {/* Right column: Contact card */}
            <div className="border border-border rounded-sm p-5 bg-white h-fit">
              <h3 className="font-display font-semibold text-ink mb-4">
                Información de contacto
              </h3>
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-terracota flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink">
                      {venue.address}, {venue.city}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {venue.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-terracota flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.346.611.901 1.465 1.87 2.434s1.823 1.524 2.434 1.87l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a2 2 0 01-2 2h-2.5A7.5 7.5 0 012 9.5V3z" />
                    </svg>
                    <p className="text-sm text-ink">{venue.phone}</p>
                  </div>
                )}

                {/* Email */}
                {venue.email && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-terracota flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <a href={`mailto:${venue.email}`} className="text-sm text-terracota hover:underline">
                      {venue.email}
                    </a>
                  </div>
                )}

                {/* Website */}
                {venue.website && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-terracota flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0l-6 6m6-6v12" />
                    </svg>
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-terracota hover:underline"
                    >
                      Visitar
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: IMAGE GALLERY */}
          <VenueGallerySection images={galleryImages} venueOwnerId={venue.owner} />

          {/* SECTION 4: UPCOMING EVENTS */}
          {venueEvents.length > 0 && (
            <EventsSection events={venueEvents} />
          )}

          {/* SECTION 5: GOOGLE MAPS EMBED */}
          <VenueMap
            address={venue.address}
            city={venue.city}
            venueName={venue.name}
            latitude={venue.latitude}
            longitude={venue.longitude}
          />
        </div>

        {/* SECTION 6: CONTACT FOOTER STRIP */}
        {(venue.email || venue.website) && (
          <div className="bg-pale border-t border-border py-8 px-6 md:px-8">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <h3 className="font-display text-lg text-ink font-semibold">
                {venue.name}
              </h3>
              <div className="flex items-center gap-4">
                {venue.email && (
                  <a
                    href={`mailto:${venue.email}`}
                    className="text-terracota hover:underline font-medium text-sm inline-flex items-center gap-1"
                  >
                    Escribir al lugar →
                  </a>
                )}
                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracota hover:underline font-medium text-sm inline-flex items-center gap-1"
                  >
                    Visitar sitio web →
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
