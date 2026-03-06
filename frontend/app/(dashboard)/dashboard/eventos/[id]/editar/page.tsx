// app/(dashboard)/dashboard/eventos/[id]/editar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { events, venues } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
import type { Event, EventCategory, Venue } from '@/types'

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const token = tokenStore.getAccess()

  const [event, setEvent] = useState<Event | null>(null)
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
    status: 'draft' as 'draft' | 'published' | 'cancelled' | 'archived',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch event and venues
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      try {
        // Fetch event
        const eventData = await events.get(eventId)
        setEvent(eventData)

        // Parse datetime for input fields (convert ISO to datetime-local format)
        const startDate = new Date(eventData.start_datetime)
        const endDate = new Date(eventData.end_datetime)
        const startStr = startDate.toISOString().slice(0, 16)
        const endStr = endDate.toISOString().slice(0, 16)

        setForm({
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          venue: eventData.venue,
          start_datetime: startStr,
          end_datetime: endStr,
          is_free: eventData.is_free,
          price: eventData.price ? parseFloat(String(eventData.price)) : 0,
          capacity: eventData.capacity ? String(eventData.capacity) : '',
          registration_url: eventData.registration_url || '',
          status: eventData.status,
        })

        // Fetch user's venues
        const venuesResult = await venues.list({}, token)
        setUserVenues(venuesResult.results as Venue[])
      } catch (err) {
        setError('Error al cargar el evento')
        console.error(err)
      } finally {
        setLoading(false)
        setVenuesLoading(false)
      }
    }

    fetchData()
  }, [token, eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !token) return

    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      await events.update(token, event.id, {
        ...form,
        price: form.is_free ? 0 : form.price,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      })

      setSuccess('Evento actualizado ✓')
      setTimeout(() => {
        router.push('/dashboard/eventos')
      }, 1500)
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al actualizar el evento.'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !token) return

    setError(null)
    setDeleting(true)

    try {
      await events.remove(token, event.id)
      router.push('/dashboard/eventos')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al eliminar el evento.'
      setError(String(msg))
      setDeleting(false)
    }
  }

  const eventCategories = Object.entries(EVENT_CATEGORY_LABELS).map(
    ([key, label]) => ({ id: key as EventCategory, label })
  )

  if (!token) return null

  if (loading) {
    return (
      <div className="text-center text-stone">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracota border-t-transparent mx-auto mb-4"></div>
        Cargando evento...
      </div>
    )
  }

  if (!event) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
        No se encontró el evento
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-ink mb-2">
          Editar evento
        </h1>
        <p className="text-stone">
          Actualiza los detalles de tu evento
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-sm mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-border rounded-sm p-6 md:p-8 mb-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Título del evento
          </label>
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
            disabled={saving || deleting}
          />
        </div>

        {/* Slug preview */}
        <div className="bg-pale px-4 py-3 rounded-sm">
          <p className="text-xs text-stone mb-1">Tu evento está en:</p>
          <p className="text-sm font-medium text-ink">
            guana.mx/eventos/<span className="text-terracota">{event.slug}</span>
          </p>
        </div>

        {/* Venue selection */}
        {venuesLoading ? (
          <div className="text-stone">Cargando tus lugares...</div>
        ) : userVenues.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-sm">
            <p className="mb-2">No tienes lugares registrados.</p>
            <Link href="/dashboard/onboarding" className="text-amber-600 hover:underline font-medium">
              Crear lugar →
            </Link>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Lugar donde ocurre el evento
            </label>
            <select
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
              disabled={saving || deleting}
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
          <label className="block text-sm font-medium text-ink mb-2">
            Descripción
          </label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
            rows={4}
            disabled={saving || deleting}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
            className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
            disabled={saving || deleting}
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
            <label className="block text-sm font-medium text-ink mb-2">
              Fecha y hora de inicio
            </label>
            <input
              required
              type="datetime-local"
              value={form.start_datetime}
              onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
              className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
              disabled={saving || deleting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Fecha y hora de término
            </label>
            <input
              required
              type="datetime-local"
              value={form.end_datetime}
              onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
              className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
              disabled={saving || deleting}
            />
          </div>
        </div>

        {/* Price section */}
        <div className="border-t border-pale pt-6">
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
              disabled={saving || deleting}
            />
            <span className="text-sm font-medium text-ink">Evento gratuito</span>
          </label>

          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Precio (MXN)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
                disabled={saving || deleting}
              />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Capacidad (opcional)
          </label>
          <input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
            disabled={saving || deleting}
          />
        </div>

        {/* Registration URL */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            URL de registro (opcional)
          </label>
          <input
            type="url"
            value={form.registration_url}
            onChange={(e) => setForm({ ...form, registration_url: e.target.value })}
            className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
            disabled={saving || deleting}
          />
        </div>

        {/* Status */}
        <div className="border-t border-pale pt-6">
          <p className="text-sm font-medium text-ink mb-3">Estado del evento</p>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={form.status === 'draft'}
              onChange={() => setForm({ ...form, status: 'draft' })}
              disabled={saving || deleting}
            />
            <span className="text-sm text-ink">Borrador (no visible públicamente)</span>
          </label>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="published"
              checked={form.status === 'published'}
              onChange={() => setForm({ ...form, status: 'published' })}
              disabled={saving || deleting}
            />
            <span className="text-sm text-ink">Publicado (visible públicamente)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="cancelled"
              checked={form.status === 'cancelled'}
              onChange={() => setForm({ ...form, status: 'cancelled' })}
              disabled={saving || deleting}
            />
            <span className="text-sm text-ink">Cancelado</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-pale">
          <button
            type="submit"
            disabled={saving || deleting || venuesLoading}
            className="flex-1 bg-terracota text-cream font-medium py-3 rounded-sm hover:bg-[#a84e23] transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link
            href="/dashboard/eventos"
            className="px-6 py-3 border border-border text-ink rounded-sm hover:bg-pale transition-colors font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Delete section */}
      <div className="bg-red-50 border border-red-200 rounded-sm p-6">
        <h3 className="font-medium text-red-900 mb-2">Peligro</h3>
        <p className="text-sm text-red-800 mb-4">
          Esta acción es irreversible. Eliminar este evento borrará todos sus datos permanentemente.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            disabled={saving || deleting}
            className="bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Eliminar evento
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Confirmar eliminación'}
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 border border-red-300 text-red-800 rounded-sm hover:bg-red-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
