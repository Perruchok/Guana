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
      <main className="min-h-screen bg-brand-bg">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          {/* Header */}
          <div className="mb-10 border-t border-slate-300 pt-6 text-center">
            <h1 className="text-4xl font-extrabold uppercase italic tracking-tight text-brand-blue md:text-5xl">
              Directorio
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-tight text-slate-500 md:text-base">
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
