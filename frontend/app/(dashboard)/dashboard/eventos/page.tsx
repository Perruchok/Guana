// app/(dashboard)/dashboard/eventos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { events, auth } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS, EVENT_TAG_CLASSES, formatPrice } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
import type { Event } from '@/types'

export default function EventosPage() {
  const token = tokenStore.getAccess()
  const [eventList, setEventList] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return
      setLoading(true)
      try {
        // first grab current user so we can filter by owner
        const me = await auth.me(token)
        const ownerFilter = { owner: me.id }
        const result = await events.list(ownerFilter, token)
        setEventList(result.results as Event[])
      } catch (err) {
        setError('Error al cargar tus eventos')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [token])

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      await events.remove(token, id)
      setEventList(eventList.filter((e) => e.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setError('Error al eliminar el evento')
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'draft') return 'bg-stone-100 text-stone-800'
    if (status === 'published') return 'bg-green-50 text-green-800'
    if (status === 'cancelled') return 'bg-red-50 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-3xl text-ink">Mis eventos</h1>
        <Link
          href="/dashboard/eventos/nuevo"
          className="bg-terracota text-cream px-4 py-2 rounded-sm font-medium hover:bg-[#a84e23] transition-colors text-sm"
        >
          + Publicar evento
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracota border-t-transparent"></div>
          </div>
          <p className="text-stone mt-4">Cargando tus eventos...</p>
        </div>
      ) : eventList.length > 0 ? (
        <div className="bg-white border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-pale">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-stone">Título</th>
                  <th className="px-6 py-3 text-left font-medium text-stone">Categoría</th>
                  <th className="px-6 py-3 text-left font-medium text-stone">Fecha</th>
                  <th className="px-6 py-3 text-left font-medium text-stone">Estado</th>
                  <th className="px-6 py-3 text-right font-medium text-stone">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventList.map((event) => {
                  const categoryLabel = EVENT_CATEGORY_LABELS[event.category]
                  const tagClass = EVENT_TAG_CLASSES[event.category]
                  return (
                    <tr key={event.id} className="hover:bg-pale transition-colors">
                      <td className="px-6 py-4 font-medium text-ink">{event.title}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-sm font-medium ${tagClass}`}>
                          {categoryLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone">
                        <div>{formatDate(event.start_datetime)}</div>
                        <div className="text-xs">{formatTime(event.start_datetime)} hrs</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-sm font-medium ${getStatusColor(event.status)}`}>
                          {event.status === 'draft'
                            ? 'Borrador'
                            : event.status === 'published'
                              ? 'Publicado'
                              : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/eventos/${event.id}/editar`}
                            className="text-terracota hover:underline text-xs font-medium"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(event.id)}
                            className="text-red-600 hover:underline text-xs font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-sm p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-pale rounded-full flex items-center justify-center text-3xl">
              📅
            </div>
          </div>
          <h2 className="font-display font-bold text-xl text-ink mb-2">
            Aún no tienes eventos
          </h2>
          <p className="text-stone mb-8 max-w-sm mx-auto">
            Publica tu primer evento para que aparezca aquí. ¡Los visitantes podrán descubrir lo que tienes para ofrecer!
          </p>
          <Link
            href="/dashboard/eventos/nuevo"
            className="inline-block bg-terracota text-cream px-6 py-3 rounded-sm font-medium hover:bg-[#a84e23] transition-colors"
          >
            + Publicar evento
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-sm w-full">
            <h2 className="font-display font-bold text-lg text-ink mb-2">Confirmar eliminación</h2>
            <p className="text-stone text-sm mb-6">
              ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border text-ink px-4 py-2 rounded-sm hover:bg-pale transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
