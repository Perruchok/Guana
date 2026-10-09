'use client'

import { useEffect, useState } from 'react'
import {
  createEmptyEventFilterState,
  parseEventFilterState,
  writeEventFilterState,
  type EventFilterState,
} from '@/lib/event-filters'

export function useEventFilterState() {
  const [filters, setFilters] = useState(createEmptyEventFilterState)

  useEffect(() => {
    const syncFromUrl = () => setFilters(parseEventFilterState(window.location.search))
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const updateFilters = (
    next: EventFilterState,
    mode: 'push' | 'replace' = 'push'
  ) => {
    writeEventFilterState(next, mode)
    setFilters(next)
  }

  return { filters, updateFilters }
}