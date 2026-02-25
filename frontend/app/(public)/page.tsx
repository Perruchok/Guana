// app/(public)/page.tsx
// Server component que obtiene datos y renderiza la home

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HomeClient from './HomeClient'
import { events, venues } from '@/lib/api'
import type { EventListItem, VenueListItem } from '@/types'

// Mock data for development/demo
const NOW = new Date()

const MOCK_EVENTS: EventListItem[] = [
  {
    id: '1',
    title: 'Noche de Jazz en el Claustro',
    slug: 'noche-jazz-claustro',
    category: 'music',
    start_datetime: new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Claustro de la Alhóndiga',
    image: null,
    is_free: false,
    price: 150,
    is_featured: true,
    owner_name: 'Claustro'
  },
  {
    id: '2',
    title: 'El Sueño de una Noche de Verano',
    slug: 'sueno-noche-verano',
    category: 'theater',
    start_datetime: new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Teatro Juárez',
    image: null,
    is_free: false,
    price: 200,
    is_featured: true,
    owner_name: 'Teatro Juárez'
  },
  {
    id: '3',
    title: 'Fotografía Urbana: Barrios de Guanajuato',
    slug: 'fotografia-barrios',
    category: 'visual_arts',
    start_datetime: new Date(NOW.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Galería Municipal',
    image: null,
    is_free: true,
    price: 0,
    is_featured: true,
    owner_name: 'Galería Municipal'
  },
  {
    id: '4',
    title: 'Taller de Cerámica para Principiantes',
    slug: 'taller-ceramica',
    category: 'workshop',
    start_datetime: new Date(NOW.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Estudio La Barro',
    image: null,
    is_free: false,
    price: 350,
    is_featured: false,
    owner_name: 'Estudio La Barro'
  },
  {
    id: '5',
    title: 'Cineforo: Nuevo Cine Mexicano',
    slug: 'cineforo-mexicano',
    category: 'cinema',
    start_datetime: new Date(NOW.getTime() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Cineteca GTO',
    image: null,
    is_free: true,
    price: 0,
    is_featured: false,
    owner_name: 'Cineteca GTO'
  },
  {
    id: '6',
    title: 'Recorrido por los Callejones Históricos',
    slug: 'recorrido-callejones',
    category: 'tour',
    start_datetime: new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    venue_name: 'Jardín Unión',
    image: null,
    is_free: false,
    price: 180,
    is_featured: false,
    owner_name: 'Free Tours Guanajuato'
  },
]

const MOCK_VENUES: VenueListItem[] = [
  {
    id: '1',
    name: 'Claustro de la Alhóndiga',
    slug: 'claustro',
    category: 'cultural_center',
      city: 'Guanajuato',
    image: null,
    is_featured: true,
    owner_name: 'Administración'
  },
  {
    id: '2',
    name: 'Teatro Juárez',
    slug: 'teatro-juarez',
      city: 'Guanajuato',
    category: 'theater',
    image: null,
    is_featured: true,
    owner_name: 'Administración'
  },
  {
    id: '3',
    name: 'Galería Municipal',
    slug: 'galeria-municipal',
    category: 'gallery',
      city: 'Guanajuato',
    image: null,
    is_featured: true,
    owner_name: 'Administración'
  },
]

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

    // TODO: Reformatear antes de lanzar a prod
    // If backend returned no data (likely unavailable), use mock data to render the UI
    if (featured.length === 0 && recent.length === 0 && featuredV.length === 0) {
      return {
        featuredEvents: MOCK_EVENTS.slice(0, 3),
        recentEvents: MOCK_EVENTS,
        featuredVenues: MOCK_VENUES,
      }
    }

    return {
      featuredEvents: featured,
      recentEvents: recent,
      featuredVenues: featuredV,
    }
  } catch (error) {
    console.warn('Backend unavailable, using mock data:', error)
    // Use mock data to show the frontend is working
    return {
      featuredEvents: MOCK_EVENTS.slice(0, 3),
      recentEvents: MOCK_EVENTS,
      featuredVenues: MOCK_VENUES,
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
