// app/(dashboard)/dashboard/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { venues, uploads } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import ImageUploader from '@/components/ui/ImageUploader'
import type { Venue, VenueCategory } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const token = tokenStore.getAccess()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: 'cultural_center' as VenueCategory,
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    status: 'draft' as 'draft' | 'published',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch user's venue
  useEffect(() => {
    const fetchVenue = async () => {
      if (!token) return
      try {
        const result = await venues.me(token)
        if ((result as Venue[]).length === 0) {
          // No venue, redirect to onboarding
          router.push('/dashboard/onboarding')
          return
        }
        const v = (result as Venue[])[0]
        setVenue(v)
        setForm({
          name: v.name,
          category: v.category,
          description: v.description,
          address: v.address,
          city: v.city,
          phone: v.phone,
          email: v.email,
          website: v.website,
          status: v.status as 'draft' | 'published',
        })
      } catch (err) {
        setError('Error al cargar tu lugar')
      } finally {
        setLoading(false)
      }
    }
    fetchVenue()
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venue || !token) return

    setError(null)
    setSaving(true)

    try {
      await venues.update(token, venue.id, { ...form, slug: venue.slug })
      setVenue({ ...venue, ...form })
      setError(null)
      // Show success message (could add better UX here)
      setSuccess('Cambios guardados ✓')
      // clear message after a few seconds
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al actualizar.'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!venue || !token) return

    setError(null)
    setPublishLoading(true)

    try {
      const newStatus = form.status === 'published' ? 'draft' : 'published'
      await venues.update(token, venue.id, { ...form, status: newStatus, slug: venue.slug })
      setForm({ ...form, status: newStatus })
      setVenue({ ...venue, status: newStatus })
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al cambiar estado.'
      setError(String(msg))
    } finally {
      setPublishLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!venue || !token) return
    setUploading(true)
    try {
      const updated = await uploads.venueImage(token, venue.id, file)
      setVenue(updated)
    } catch (err: any) {
      setError(err.detail || 'Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const categories = Object.entries(VENUE_CATEGORY_LABELS).map(
    ([key, label]) => ({ id: key as VenueCategory, label })
  )

  if (loading) {
    return <div className="text-center text-slate-500">Cargando...</div>
  }

  if (!venue) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-extrabold tracking-tight text-3xl text-gray-900 mb-2">
          Mi lugar
        </h1>
        <p className="text-slate-500">
          Administra tu espacio o negocio
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-200 rounded-sm p-6 md:p-8 mb-6">
        {/* Image Upload */}
        <ImageUploader
          currentImage={venue.image}
          onUpload={handleImageUpload}
          loading={uploading}
          label="Foto principal de tu lugar"
          hint="JPG, PNG o WebP · Máx 5MB · Esta imagen aparece en el directorio y en tu perfil"
        />

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Nombre de tu negocio o proyecto
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* Slug preview */}
        <div className="bg-slate-50 px-4 py-3 rounded-sm">
          <p className="text-xs text-slate-500 mb-1">Tu página:</p>
          <p className="text-sm font-medium text-gray-900">
            guanaknow.mx/lugares/<span className="text-brand-blue-light">{venue.slug}</span>
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as VenueCategory })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            rows={4}
            disabled={saving}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Sitio web (opcional)
          </label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={saving}
          />
        </div>

        {/* Status */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Estado del lugar</p>
              <p className="text-xs text-slate-500 mt-1">
                {form.status === 'published'
                  ? 'Tu lugar es visible públicamente'
                  : 'Tu lugar está en borrador, no es visible públicamente'}
              </p>
            </div>
            {form.status === 'published' ? (
              <div className="flex items-center gap-3">
                <span className="text-green-800 bg-green-50 px-2 py-1 rounded-sm text-xs font-medium">
                  Publicado ✓
                </span>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishLoading || saving}
                  className="px-4 py-2 rounded-sm text-sm font-medium bg-stone-100 text-slate-500-800 hover:bg-stone-200 transition-colors"
                >
                  {publishLoading ? 'Cambiando...' : 'Despublicar'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishLoading || saving}
                className="px-4 py-2 rounded-sm text-sm font-medium bg-brand-blue text-white hover:bg-brand-blue-light transition-colors"
              >
                {publishLoading ? 'Cambiando...' : 'Publicar mi lugar'}
              </button>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand-blue text-white font-medium py-3 rounded-sm hover:bg-brand-blue-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-slate-200 text-gray-900 rounded-sm hover:bg-slate-50 transition-colors font-medium"
          >
            Volver
          </Link>
        </div>
      </form>
    </div>
  )
}
