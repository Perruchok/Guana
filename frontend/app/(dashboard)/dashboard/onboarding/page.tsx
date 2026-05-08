// app/(dashboard)/dashboard/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { venues } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import type { VenueCategory } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const token = tokenStore.getAccess()

  const [form, setForm] = useState({
    name: '',
    category: 'cultural_center' as VenueCategory,
    description: '',
    address: '',
    city: 'Guanajuato',
    phone: '',
    email: '',
    website: '',
  })

  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm({ ...form, name: value })
    setSlug(generateSlug(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!token) throw new Error('No token found')

      await venues.create(token, {
        ...form,
        slug: slug || generateSlug(form.name),
        status: 'draft',
      })

      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al crear el lugar.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  const categories = Object.entries(VENUE_CATEGORY_LABELS).map(
    ([key, label]) => ({ id: key as VenueCategory, label })
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-extrabold tracking-tight text-3xl text-gray-900 mb-2">
          Crea tu lugar
        </h1>
        <p className="text-slate-500">
          Configura tu espacio o negocio para publicar eventos
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-200 rounded-sm p-6 md:p-8">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Nombre de tu negocio o proyecto
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={handleNameChange}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            placeholder="Galería Municipal"
            disabled={loading}
          />
        </div>

        {/* Slug preview */}
        {slug && (
          <div className="bg-slate-50 px-4 py-3 rounded-sm">
            <p className="text-xs text-slate-500 mb-1">Tu página será:</p>
            <p className="text-sm font-medium text-gray-900">
              guanaknow.mx/lugares/<span className="text-brand-blue-light">{slug}</span>
            </p>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as VenueCategory })}
            className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
            disabled={loading}
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
            placeholder="Cuéntanos sobre tu lugar..."
            rows={4}
            disabled={loading}
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
            placeholder="Calle Principal 123"
            disabled={loading}
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
            placeholder="Guanajuato"
            disabled={loading}
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
            placeholder="+52 (555) 123-4567"
            disabled={loading}
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
            placeholder="contacto@lugar.mx"
            disabled={loading}
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
            placeholder="https://ejemplo.com"
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-blue text-white font-medium py-3 rounded-sm hover:bg-brand-blue-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear lugar'}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-slate-200 text-gray-900 rounded-sm hover:bg-slate-50 transition-colors font-medium"
          >
            Completar después →
          </Link>
        </div>
      </form>
    </div>
  )
}
