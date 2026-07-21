'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import InstagramConnectionCard from '@/components/dashboard/venues/InstagramConnectionCard'
import { venues } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import type { Venue, VenueCategory } from '@/types'

export default function VenueDetailPage() {
  const params = useParams()
  const venueSlug = params.slug as string
  const token = tokenStore.getAccess()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVenue = async () => {
      if (!token) {
        setError('Tu sesión expiró. Vuelve a iniciar sesión.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await venues.list({ slug: venueSlug }, token)
        const found = (result.results as Venue[])[0] ?? null
        if (!found) {
          setError('No encontramos este lugar en tu cuenta.')
          setVenue(null)
        } else {
          setVenue(found)
        }
      } catch {
        setError('No se pudo cargar la configuración del lugar.')
      } finally {
        setLoading(false)
      }
    }

    fetchVenue()
  }, [token, venueSlug])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{venue?.name ?? 'Lugar'}</h1>
          <p className="mt-1 text-sm text-slate-500">{venue ? VENUE_CATEGORY_LABELS[venue.category as VenueCategory] : 'Configuración del lugar'}</p>
        </div>
        <Link
          href="/dashboard/perfil"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-colors hover:border-slate-400 hover:text-gray-900"
        >
          Editar perfil del lugar
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Cargando detalles del lugar...</div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && venue && (
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fuentes de eventos</h2>
            <p className="mt-1 text-sm text-slate-500">Gestiona integraciones para importar borradores automáticamente.</p>
          </div>
          <InstagramConnectionCard venueSlug={venueSlug} />
        </section>
      )}
    </div>
  )
}
