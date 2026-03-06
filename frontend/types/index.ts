// ─────────────────────────────────────────────
// types/index.ts
// Mirrors the Django backend models exactly.
// Update here when backend models change.
// ─────────────────────────────────────────────

// ── Users ────────────────────────────────────

export type UserType = 'individual' | 'business'

export interface User {
  id: string               // UUID
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: UserType
  bio: string
  avatar: string | null
  created_at: string       // ISO datetime
  updated_at: string
}

// ── Auth ─────────────────────────────────────

export interface TokenPair {
  access: string
  refresh: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

// ── Subscriptions ─────────────────────────────

export type PlanId = 'free' | 'basic' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending'

export interface Plan {
  id: PlanId
  name: string
  description: string
  price_monthly: number         // MXN
  max_venues: number
  max_events_per_month: number
  features: {
    analytics: boolean
    priority_support: boolean
    [key: string]: boolean
  }
  is_active: boolean
}

export interface Subscription {
  id: string
  user: string
  user_email: string
  plan: PlanId
  plan_name: string
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  renewal_date: string | null
  created_at: string
  updated_at: string
}

// ── Venues ────────────────────────────────────

export type VenueStatus   = 'draft' | 'published' | 'archived'
export type VenueCategory =
  | 'museum' | 'gallery' | 'theater' | 'cinema'
  | 'cafe' | 'cultural_center' | 'library'
  | 'market' | 'public_space' | 'other'

export interface Venue {
  id: string
  owner: string
  owner_name: string
  name: string
  slug: string
  description: string
  category: VenueCategory
  address: string
  city: string
  state: string
  postal_code: string
  latitude: string | null
  longitude: string | null
  phone: string
  email: string
  website: string
  image: string | null
  status: VenueStatus
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface VenueListItem {
  id: string
  name: string
  slug: string
  category: VenueCategory
  city: string
  image: string | null
  is_featured: boolean
  owner_name: string
}

// ── Events ────────────────────────────────────

export type EventStatus   = 'draft' | 'published' | 'cancelled' | 'archived'
export type EventCategory =
  | 'exhibition' | 'performance' | 'workshop' | 'conference'
  | 'festival' | 'cinema' | 'music' | 'theater' | 'dance'
  | 'art' | 'literature' | 'other'

export interface Event {
  id: string
  owner: string
  owner_name: string
  venue: string
  venue_name: string
  venue_slug: string
  title: string
  slug: string
  description: string
  category: EventCategory
  image: string | null
  start_datetime: string    // ISO datetime (Mexico City TZ)
  end_datetime: string
  capacity: number | null
  registered_count: number
  price: number             // MXN, 0 = free
  is_free: boolean
  registration_url: string | null
  status: EventStatus
  is_featured: boolean
  is_upcoming: boolean
  is_ongoing: boolean
  is_past: boolean
  created_at: string
  updated_at: string
}

export interface EventListItem {
  id: string
  title: string
  slug: string
  category: EventCategory
  image: string | null
  start_datetime: string
  venue_name: string
  venue_slug: string
  is_free: boolean
  price: number
  is_featured: boolean
  owner_name: string
}

// ── API response wrappers ─────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  [field: string]: string | string[] | undefined
}

// ── Filter/query params ───────────────────────

export interface EventFilters {
  category?: EventCategory
  is_featured?: boolean
  is_free?: boolean
  search?: string
  ordering?: string
  page?: number
  venue?: string
  status?: EventStatus
  owner?: string
}

export interface VenueFilters {
  category?: VenueCategory
  city?: string
  is_featured?: boolean
  search?: string
  ordering?: string
  page?: number
  status?: VenueStatus
}
