'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { tokenStore } from '@/lib/auth'
import { auth } from '@/lib/api'
import VenueGallery from './VenueGallery'
import type { User } from '@/types'

interface VenueGallerySectionProps {
  images: string[]
  venueOwnerId: string
}

export default function VenueGallerySection({ images, venueOwnerId }: VenueGallerySectionProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const token = tokenStore.getAccess()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const user = await auth.me(token)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

  if (images.length > 0) {
    return <VenueGallery images={images} />
  }

  // If no images, only show placeholder if user is the owner and not loading
  if (isLoading || !currentUser || currentUser.id !== venueOwnerId) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-black text-2xl text-ink">
        Galería de fotos
      </h2>

      <div className="border-2 border-dashed border-border rounded-sm bg-pale py-12">
        <div className="text-center space-y-4">
          {/* Photo icon */}
          <svg
            className="w-12 h-12 text-stone mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <div className="space-y-2">
            <p className="text-ink font-medium">
              Aún no tienes fotos de tu lugar
            </p>
            <p className="text-stone text-sm">
              Añade imágenes para que los visitantes conozcan tu espacio.
            </p>
          </div>

          <Link
            href="/dashboard/perfil"
            className="inline-flex items-center gap-2 bg-terracota text-cream text-xs uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-terracota/90 transition-colors"
          >
            Añadir fotos →
          </Link>
        </div>
      </div>
    </div>
  )
}