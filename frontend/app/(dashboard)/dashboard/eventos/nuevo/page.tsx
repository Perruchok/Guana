// app/(dashboard)/dashboard/eventos/nuevo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { events, venues, uploads } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS, VENUE_CATEGORY_LABELS } from '@/lib/utils'
import ImageUploader from '@/components/ui/ImageUploader'
import type { EventCategory, Venue, Event } from '@/types'

export default function NuevoEventoPage() {
  const router = useRouter()
  const token = tokenStore.getAccess()

  const [userVenues, setUserVenues] = useState<Venue[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'music' as EventCategory,
    venue: '',
    start_datetime: '',
    end_datetime: '',
    is_free: true,
    price: 0,
    capacity: '',
    registration_url: '',
    status: 'draft' as 'draft' | 'published',
  })

  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [pendingImage, setPendingImage] = useState<File | null>(null)

  // Fetch user's venues
  useEffect(() => {
    const fetchVenues = async () => {
      if (!token) return
      try {
        const result = await venues.list({}, token)
        setUserVenues(result.results as Venue[])
        if (result.results.length > 0) {
          setForm((prev) => ({ ...prev, venue: (result.results[0] as Venue).id }))
        }
      } catch (err) {
        console.error('Error loading venues:', err)
      } finally {
        setVenuesLoading(false)
      }
    }
    fetchVenues()
  }, [token])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm({ ...form, title: value })
    setSlug(generateSlug(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!token) throw new Error('No token found')

      const newEvent = await events.create(token, {
        ...form,
        slug: slug || generateSlug(form.title),
        price: form.is_free ? 0 : form.price,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      }) as Event

      // Upload image if one was selected
      if (pendingImage && newEvent.id) {
        await uploads.eventImage(token, newEvent.id, pendingImage)
      }

      router.push('/dashboard/eventos')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al crear el evento.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  const eventCategories = Object.entries(EVENT_CATEGORY_LABELS).map(
    ([key, label]) => ({ id: key as EventCategory, label })
  )

  if (!token) return null

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-extrabold tracking-tight text-3xl text-gray-900 mb-2">
          Publicar evento
        </h1>
        <p className="text-slate-500">
          Crea un nuevo evento en tu lugar
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-200 rounded-sm p-6 md:p-8">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Título del evento
          </label>
          <input
            required
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            placeholder="Noche de Jazz en el Claustro"
            disabled={loading}
          />
        </div>

        {/* Slug preview */}
        {slug && (
          <div className="bg-slate-50 px-4 py-3 rounded-sm">
            <p className="text-xs text-slate-500 mb-1">Tu evento será accesible en:</p>
            <p className="text-sm font-medium text-gray-900">
              guana.mx/eventos/<span className="text-brand-blue-light">{slug}</span>
            </p>
          </div>
        )}

        {/* Image Upload (optional) */}
        <ImageUploader
          currentImage={pendingImage ? URL.createObjectURL(pendingImage) : null}
          onUpload={async (file) => setPendingImage(file)}
          label="Imagen del evento (opcional)"
          hint="JPG, PNG o WebP · Máx 5MB"
        />

        {/* Venue selection */}
        {venuesLoading ? (
          <div className="text-slate-500">Cargando tus lugares...</div>
        ) : userVenues.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-sm">
            <p className="mb-2">Primero debes crear tu lugar.</p>
            <Link href="/dashboard/onboarding" className="text-amber-600 hover:underline font-medium">
              Crear lugar →
            </Link>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Lugar donde ocurre el evento
            </label>
            <select
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              disabled={loading}
              required
            >
              {userVenues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Descripción
          </label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            placeholder="Cuéntanos de qué se trata este evento..."
            rows={4}
            disabled={loading}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={loading}
          >
            {eventCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Fecha y hora de inicio
            </label>
            <input
              required
              type="datetime-local"
              value={form.start_datetime}
              onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Fecha y hora de término
            </label>
            <input
              required
              type="datetime-local"
              value={form.end_datetime}
              onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              disabled={loading}
            />
          </div>
        </div>

        {/* Price section */}
        <div className="border-t border-slate-200 pt-6">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) => {
                setForm({
                  ...form,
                  is_free: e.target.checked,
                  price: e.target.checked ? 0 : form.price,
                })
              }}
              className="rounded"
              disabled={loading}
            />
            <span className="text-sm font-medium text-gray-900">Evento gratuito</span>
          </label>

          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Precio (MXN)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                placeholder="150"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Capacidad (opcional)
          </label>
          <input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            placeholder="100"
            disabled={loading}
          />
        </div>

        {/* Registration URL */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            URL de registro (opcional)
          </label>
          <input
            type="url"
            value={form.registration_url}
            onChange={(e) => setForm({ ...form, registration_url: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            placeholder="https://entradas.ejemplo.com"
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div className="border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-gray-900 mb-3">¿Cómo quieres guardar el evento?</p>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={form.status === 'draft'}
              onChange={() => setForm({ ...form, status: 'draft' })}
              disabled={loading}
            />
            <span className="text-sm text-gray-900">Guardar como borrador</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="published"
              checked={form.status === 'published'}
              onChange={() => setForm({ ...form, status: 'published' })}
              disabled={loading}
            />
            <span className="text-sm text-gray-900">Publicar ahora</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading || userVenues.length === 0}
            className="flex-1 bg-brand-blue text-white font-medium py-3 rounded-sm hover:bg-brand-blue-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Publicando...' : 'Publicar evento'}
          </button>
          <Link
            href="/dashboard/eventos"
            className="px-6 py-3 border border-slate-200 text-gray-900 rounded-sm hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
