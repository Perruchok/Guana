// app/(public)/page.tsx
// Server component que obtiene datos y renderiza la home

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HomeClient from './HomeClient'
import { events, venues } from '@/lib/api'
import type { EventListItem, VenueListItem } from '@/types'

// Note: removed mock frontend data; homepage will render empty states if backend returns no data.

export const metadata = {
  title: 'Inicio — Guana Know',
  description: 'Descubre los eventos culturales y negocios de Guanajuato',
}

async function getInitialData() {
  try {
    // Obtener eventos destacados y recientes
    const eventsRes = await Promise.all([
      events.featured().catch(() => ({ results: [] })),
      events.list({ ordering: '-start_datetime' }).catch(() => ({ results: [] })),
      venues.list({ is_featured: true }).catch(() => ({ results: [] })),
    ])
    
    const featured = (eventsRes[0] as any).results as EventListItem[]
    const recent = (eventsRes[1] as any).results as EventListItem[]
    const featuredV = (eventsRes[2] as any).results as VenueListItem[]

    // Return the data fetched from backend (may be empty arrays)
    return {
      featuredEvents: featured,
      recentEvents: recent,
      featuredVenues: featuredV,
    }
  } catch (error) {
    console.warn('Backend unavailable:', error)
    // Return empty arrays so UI shows proper empty states
    return {
      featuredEvents: [],
      recentEvents: [],
      featuredVenues: [],
    }
  }
}

export default async function HomePage() {
  const { featuredEvents, recentEvents, featuredVenues } = await getInitialData()

  return (
    <>
      <Navbar />
      <HomeClient
        featuredEvents={featuredEvents}
        recentEvents={recentEvents}
        featuredVenues={featuredVenues}
      />
      <Footer />
    </>
  )
}
