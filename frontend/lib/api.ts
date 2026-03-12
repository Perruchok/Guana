// ─────────────────────────────────────────────
// lib/api.ts
// Single source of truth for all backend calls.
// All components import from here — never fetch directly.
// ─────────────────────────────────────────────

import type {
  User, TokenPair,
  Event, EventListItem, EventFilters,
  Venue, VenueListItem, VenueFilters,
  Plan, Subscription,
  PaginatedResponse, ApiError,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'
export const API_BASE_URL = BASE

// ── Core fetch wrapper ────────────────────────

interface FetchOptions extends RequestInit {
  token?: string | null
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> ?? {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...rest, headers })

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw error
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ── Query string builder ──────────────────────

function toQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return entries.length ? `?${entries.join('&')}` : ''
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const auth = {
  /** POST /users/token/ */
  login: (username: string, password: string) =>
    apiFetch<TokenPair>('/users/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  /** POST /users/token/refresh/ */
  refresh: (refreshToken: string) =>
    apiFetch<TokenPair>('/users/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    }),

  /** POST /users/ — registration */
  register: (data: {
    email: string
    username: string
    password: string
    password_confirm: string
    first_name: string
    last_name: string
    user_type: 'individual' | 'business'
  }) =>
    apiFetch<User>('/users/', { method: 'POST', body: JSON.stringify(data) }),

  /** GET /users/me/ */
  me: (token: string) =>
    apiFetch<User>('/users/me/', { token }),
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────

export const events = {
  /** GET /events/ — public paginated list, or authenticated for owner filtering */
  list: (filters: EventFilters = {}, token?: string | null, fetchOptions: RequestInit = {}) =>
    apiFetch<PaginatedResponse<EventListItem>>(
      `/events/${toQueryString(filters as Record<string, unknown>)}`,
      { token, ...fetchOptions }
    ),

  /** GET /events/featured — convenience: featured + upcoming */
  featured: () =>
    apiFetch<PaginatedResponse<EventListItem>>(
      `/events/?is_featured=true&ordering=-is_featured,start_datetime`
    ),

  /** GET /events/{id}/ */
  get: (id: string) =>
    apiFetch<Event>(`/events/${id}/`),

  /** GET /events/?search=slug (slug lookup — adjust if backend adds slug endpoint) */
  getBySlug: (slug: string) =>
    apiFetch<PaginatedResponse<Event>>(`/events/?search=${slug}`),

  /** POST /events/ — auth required */
  create: (token: string, data: Partial<Event>) =>
    apiFetch<Event>('/events/', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  /** PUT /events/{id}/ — owner only */
  update: (token: string, id: string, data: Partial<Event>) =>
    apiFetch<Event>(`/events/${id}/`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  /** DELETE /events/{id}/ — owner only */
  remove: (token: string, id: string) =>
    apiFetch<void>(`/events/${id}/`, { method: 'DELETE', token }),
}

// ─────────────────────────────────────────────
// VENUES
// ─────────────────────────────────────────────

export const venues = {
    /** GET /venues/?slug={slug}&status=published — busca venue por slug */
    bySlug: async (slug: string, fetchOptions: RequestInit = {}) => {
      const res = await apiFetch<PaginatedResponse<VenueListItem>>(
        `/venues/?slug=${encodeURIComponent(slug)}&status=published`,
        { ...fetchOptions }
      );
      if (!res.results || res.results.length === 0) return null;
      return res.results[0];
    },
  /** GET /venues/ — public list or authenticated for owner filtering */
  list: (filters: VenueFilters = {}, token?: string | null) =>
    apiFetch<PaginatedResponse<VenueListItem>>(
      `/venues/${toQueryString(filters as Record<string, unknown>)}`,
      { token }
    ),

  /** GET /venues/{id}/ */
  get: (id: string) =>
    apiFetch<Venue>(`/venues/${id}/`),

  /** GET /venues/me/ — authenticated user's venues (array) */
  me: (token: string) =>
    apiFetch<Venue[]>('/venues/me/', { token }),

  /** POST /venues/ — auth required */
  create: (token: string, data: Partial<Venue>) =>
    apiFetch<Venue>('/venues/', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  /** PUT /venues/{id}/ — owner only */
  update: (token: string, id: string, data: Partial<Venue>) =>
    apiFetch<Venue>(`/venues/${id}/`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  /** DELETE /venues/{id}/ */
  remove: (token: string, id: string) =>
    apiFetch<void>(`/venues/${id}/`, { method: 'DELETE', token }),
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────

export const subscriptions = {
  /** GET /subscriptions/plans/ — public */
  plans: async () => {
    const res = await apiFetch<any>('/subscriptions/plans/')
    if (Array.isArray(res)) return res as Plan[]
    return (res.results ?? res) as Plan[]
  },

  /** GET /subscriptions/me/ — auth required */
  me: (token: string) =>
    apiFetch<Subscription>('/subscriptions/me/', { token }),

  /** POST /subscriptions/upgrade/ */
  upgrade: (token: string, planId: string) =>
    apiFetch<Subscription>('/subscriptions/upgrade/', {
      method: 'POST',
      token,
      body: JSON.stringify({ plan_id: planId }),
    }),
}

// ─────────────────────────────────────────────
// UPLOADS
// ─────────────────────────────────────────────

export const uploads = {
  /**
   * POST /venues/{id}/upload-image/
   * Uploads a single image file for a venue.
   */
  venueImage: async (token: string, venueId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch(
      `${BASE}/venues/${venueId}/upload-image/`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type here — browser sets it with boundary
        body: formData,
      }
    )
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error al subir imagen' }))
      throw error
    }
    return res.json() as Promise<Venue>
  },

  /**
   * POST /events/{id}/upload-image/
   * Uploads a single image file for an event.
   */
  eventImage: async (token: string, eventId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch(
      `${BASE}/events/${eventId}/upload-image/`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    )
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error al subir imagen' }))
      throw error
    }
    return res.json() as Promise<Event>
  },
}
