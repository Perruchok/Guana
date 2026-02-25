// ─────────────────────────────────────────────
// lib/auth.ts
// JWT token management — read/write/clear.
// Uses cookies (not localStorage) so Next.js
// server components can also read the token.
// ─────────────────────────────────────────────

import Cookies from 'js-cookie'

const ACCESS_KEY  = 'gk_access'
const REFRESH_KEY = 'gk_refresh'

export const tokenStore = {
  getAccess:  ()  => Cookies.get(ACCESS_KEY) ?? null,
  getRefresh: ()  => Cookies.get(REFRESH_KEY) ?? null,

  setTokens: (access: string, refresh: string) => {
    // access: 1 hour, refresh: 7 days (matches Django settings)
    Cookies.set(ACCESS_KEY,  access,  { expires: 1 / 24, sameSite: 'strict' })
    Cookies.set(REFRESH_KEY, refresh, { expires: 7,       sameSite: 'strict' })
  },

  clear: () => {
    Cookies.remove(ACCESS_KEY)
    Cookies.remove(REFRESH_KEY)
  },

  isLoggedIn: () => !!Cookies.get(ACCESS_KEY),
}

// ── Display helpers ───────────────────────────

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoString))
}

export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoString))
}

export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} · ${formatTime(isoString)} hrs`
}
