// app/(public)/directorio/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { VenueListItem } from '@/types'
import { venues } from '@/lib/api'
import DirectorioContent from './DirectorioContent'

export const metadata = {
  title: 'Directorio — Guana',
  description: 'Descubre negocios y espacios culturales de Guanajuato',
}

async function getDirectorioData(category?: string) {
  try {
    const filters: Record<string, any> = {
      status: 'published',
      ordering: '-is_featured',
    }
    if (category) {
      filters.category = category
    }
    const result = await venues.list(filters)
    return (result.results || []) as VenueListItem[]
  } catch (error) {
    console.error('Error loading venues:', error)
    return []
  }
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const initialVenues = await getDirectorioData(searchParams.category)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-12 md:py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-display font-black text-4xl md:text-5xl text-ink mb-2">
              Directorio
            </h1>
            <p className="text-stone text-lg">
              Negocios y espacios de Guanajuato
            </p>
          </div>

          {/* Filter (client component) */}
          <DirectorioContent initialVenues={initialVenues} initialCategory={searchParams.category} />
        </div>
      </main>
      <Footer />
    </>
  )
}
