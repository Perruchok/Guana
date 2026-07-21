// app/(dashboard)/dashboard/eventos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { events, auth } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { EVENT_CATEGORY_LABELS, EVENT_TAG_CLASSES } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/auth'
import type { Event } from '@/types'

const DASHBOARD_EVENTS_PAGE_SIZE = 20

export default function EventosPage() {
  const token = tokenStore.getAccess()
  const [eventList, setEventList] = useState<Event[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [instagramDraftsOnly, setInstagramDraftsOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredEvents = instagramDraftsOnly
    ? eventList.filter((event) => event.status === 'draft')
    : eventList

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        // first grab current user so we can filter by owner
        const me = await auth.me(token)
        const ownerFilter = {
          owner: me.id,
          page: currentPage,
          ordering: '-created_at',
        }
        const result = await events.list(ownerFilter, token)
        setEventList(result.results as Event[])
        setTotalEvents(result.count)
        setTotalPages(Math.max(1, Math.ceil(result.count / DASHBOARD_EVENTS_PAGE_SIZE)))
      } catch (err) {
        setError('Error al cargar tus eventos')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [token, currentPage])

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      await events.remove(token, id)
      setEventList((current) => current.filter((e) => e.id !== id))
      setTotalEvents((current) => Math.max(0, current - 1))
      setDeleteConfirm(null)
    } catch (err) {
      setError('Error al eliminar el evento')
    }
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const getStatusColor = (status: string) => {
    if (status === 'draft') return 'bg-stone-100 text-slate-500-800'
    if (status === 'published') return 'bg-green-50 text-green-800'
    if (status === 'cancelled') return 'bg-red-50 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-extrabold tracking-tight text-3xl text-gray-900">Mis eventos</h1>
        <Link
          href="/dashboard/eventos/nuevo"
          className="bg-brand-blue text-white px-4 py-2 rounded-sm font-medium hover:bg-brand-blue-light transition-colors text-sm"
        >
          + Publicar evento
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setInstagramDraftsOnly((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
            instagramDraftsOnly
              ? 'bg-brand-blue text-white'
              : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-gray-900'
          }`}
        >
          Borradores de Instagram
        </button>
      </div>

      {instagramDraftsOnly && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Revisa y edita estos borradores antes de publicarlos.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-blue border-t-transparent"></div>
          </div>
          <p className="text-slate-500 mt-4">Cargando tus eventos...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Título</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Categoría</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Fecha</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Estado</th>
                  <th className="px-6 py-3 text-right font-medium text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvents.map((event) => {
                  const categoryLabel = EVENT_CATEGORY_LABELS[event.category]
                  const tagClass = EVENT_TAG_CLASSES[event.category]
                  return (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-sm font-medium ${tagClass}`}>
                          {categoryLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
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
                            className="text-brand-blue-light hover:underline text-xs font-medium"
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

          <div className="flex flex-col gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Mostrando página {currentPage} de {totalPages} · {totalEvents} eventos en total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="min-w-16 text-center text-xs font-semibold text-slate-700">{currentPage}</span>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl">
              📅
            </div>
          </div>
          <h2 className="font-bold tracking-tight text-xl text-gray-900 mb-2">
            {instagramDraftsOnly ? 'No tienes borradores de Instagram' : 'Aún no tienes eventos'}
          </h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            {instagramDraftsOnly
              ? 'Cuando sincronices Instagram y se detecten eventos, aparecerán aquí como borradores.'
              : 'Publica tu primer evento para que aparezca aquí. ¡Los visitantes podrán descubrir lo que tienes para ofrecer!'}
          </p>
          <Link
            href="/dashboard/eventos/nuevo"
            className="inline-block bg-brand-blue text-white px-6 py-3 rounded-sm font-medium hover:bg-brand-blue-light transition-colors"
          >
            + Publicar evento
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-sm w-full">
            <h2 className="font-bold tracking-tight text-lg text-gray-900 mb-2">Confirmar eliminación</h2>
            <p className="text-slate-500 text-sm mb-6">
              ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-200 text-gray-900 px-4 py-2 rounded-sm hover:bg-slate-50 transition-colors"
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
