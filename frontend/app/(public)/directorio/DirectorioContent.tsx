// app/(public)/directorio/DirectorioContent.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { venues } from '@/lib/api'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import type { VenueListItem, VenueCategory } from '@/types'

interface Props {
  initialVenues: VenueListItem[]
  initialCategory?: string
}

export default function DirectorioContent({ initialVenues, initialCategory }: Props) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | 'all'>(
    (initialCategory as VenueCategory) || 'all'
  )
  const [venueList, setVenueList] = useState<VenueListItem[]>(initialVenues)
  const [loading, setLoading] = useState(false)

  const categories = Object.entries(VENUE_CATEGORY_LABELS).map(
    ([key, label]) => ({ id: key as VenueCategory, label })
  )

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true)
      try {
        const filters: Record<string, any> = {
          status: 'published',
          ordering: '-is_featured',
        }
        if (selectedCategory !== 'all') {
          filters.category = selectedCategory
        }
        const result = await venues.list(filters)
        setVenueList((result.results || []) as VenueListItem[])

        // Update URL
        if (selectedCategory === 'all') {
          router.push('/directorio')
        } else {
          router.push(`/directorio?category=${selectedCategory}`)
        }
      } catch (error) {
        console.error('Error loading venues:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [selectedCategory, router])

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('')
  }

  return (
    <div>
      {/* Category filter bar */}
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-brand-blue text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-gray-800'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-brand-blue text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-gray-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Venue list */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {venueList.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venueList.map((venue) => {
              const categoryLabel = VENUE_CATEGORY_LABELS[venue.category]

              return (
                <Link
                  key={venue.id}
                  href={`/lugares/${venue.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-300 bg-white"
                >
                  {venue.image ? (
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200">
                      <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {getInitials(venue.name)}
                      </span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" aria-hidden="true" />
                    <span>{categoryLabel}</span>
                  </div>

                  <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                    <div className="min-w-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      <span className="block truncate">{venue.name}</span>
                    </div>
                    <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-blue">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-300 bg-white p-8 text-center">
            <p className="mb-4 text-slate-500">No encontramos lugares en esta categoría.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-sm font-semibold text-brand-blue transition-colors hover:text-brand-blue-light"
            >
              Ver todos los lugares →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
