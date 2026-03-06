// app/(public)/directorio/DirectorioClient.tsx
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

export default function DirectorioClient({ initialVenues, initialCategory }: Props) {
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

  // Color palette for avatars
  const avatarColors = [
    'bg-amber-100 text-amber-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-red-100 text-red-800',
    'bg-cyan-100 text-cyan-800',
    'bg-indigo-100 text-indigo-800',
  ]

  const getAvatarColor = (id: string) => {
    const index = id.charCodeAt(0) % avatarColors.length
    return avatarColors[index]
  }

  return (
    <div>
      {/* Category filter bar */}
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-ink text-cream'
                : 'border border-border bg-white text-ink hover:border-ink'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-ink text-cream'
                  : 'border border-border bg-white text-ink hover:border-ink'
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
          <div className="space-y-3">
            {venueList.map((venue) => {
              const initials = getInitials(venue.name)
              const avatarColor = getAvatarColor(venue.id)
              const categoryLabel = VENUE_CATEGORY_LABELS[venue.category]

              return (
                <Link
                  key={venue.id}
                  href={`/lugares/${venue.slug}`}
                  className="block border border-border bg-white rounded-sm p-4 md:p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor}`}
                    >
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-ink group-hover:text-terracota transition-colors">
                        {venue.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium bg-pale px-2 py-0.5 rounded-sm">
                          {categoryLabel}
                        </span>
                        {venue.city && (
                          <span className="text-xs text-stone">📍 {venue.city}</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-stone mt-2 line-clamp-1">
                        {venue.id} {/* Placeholder — backend will include description in VenueListItem if needed */}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div className="flex-shrink-0 text-stone group-hover:text-terracota transition-colors">
                      →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-sm p-8 text-center">
            <p className="text-stone mb-4">No encontramos lugares en esta categoría.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-terracota hover:underline text-sm font-medium"
            >
              Ver todos los lugares →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
