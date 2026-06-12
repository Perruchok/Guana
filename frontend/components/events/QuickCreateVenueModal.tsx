'use client'

import { useEffect, useState } from 'react'
import { venues } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { VENUE_CATEGORY_LABELS } from '@/lib/utils'
import type { Venue, VenueCategory } from '@/types'

interface QuickCreateVenueModalProps {
  isOpen: boolean
  onClose: () => void
  onVenueCreated: (venue: Venue) => void
}

const DEFAULT_CITY = 'Guanajuato'

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
}

export default function QuickCreateVenueModal({
  isOpen,
  onClose,
  onVenueCreated,
}: QuickCreateVenueModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: 'cultural_center' as VenueCategory,
    address: '',
    city: DEFAULT_CITY,
  })

  useEffect(() => {
    setToken(tokenStore.getAccess())
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setLoading(false)
    setForm({
      name: '',
      category: 'cultural_center',
      address: '',
      city: DEFAULT_CITY,
    })
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handler)
    }

    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!token) throw new Error('No token found')

      const venue = await venues.create(token, {
        name: form.name,
        slug: generateSlug(form.name),
        description: `${form.name}${form.address ? ` · ${form.address}` : ''}`,
        category: form.category,
        address: form.address,
        city: form.city,
      })

      onVenueCreated(venue)
      onClose()
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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="animate-modal bg-white rounded-xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Crear nuevo espacio</h2>
            <p className="text-xs text-slate-500 mt-1">Se guardará y quedará seleccionado para tu evento.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-gray-700 transition-colors p-1"
            aria-label="Cerrar"
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Nombre
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              placeholder="Foro Experimental"
              disabled={loading}
            />
          </div>

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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Dirección
            </label>
            <input
              required
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              placeholder="Calle Principal 123"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Ciudad
            </label>
            <input
              required
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
              placeholder={DEFAULT_CITY}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-xs font-medium py-2 rounded-lg text-slate-500 hover:text-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-brand-blue text-white text-xs font-medium py-2 rounded-lg hover:bg-brand-blue-light transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear espacio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}