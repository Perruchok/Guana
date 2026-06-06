'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera } from 'lucide-react'
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
    <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Galeria</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Fotos del espacio</h2>
        </div>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-brand-bg py-12">
        <div className="space-y-4 text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-400" strokeWidth={1.5} aria-hidden="true" />

          <div className="space-y-2">
            <p className="font-semibold text-gray-900">Aun no tienes fotos de tu lugar</p>
            <p className="text-sm text-slate-500">Anade imagenes para que los visitantes conozcan tu espacio.</p>
          </div>

          <Link
            href="/dashboard/perfil"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-blue-light"
          >
            Anadir fotos
          </Link>
        </div>
      </div>
    </section>
  )
}