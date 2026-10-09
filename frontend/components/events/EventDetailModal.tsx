'use client'
// components/events/EventDetailModal.tsx
// Client wrapper used by the intercepted route to render EventDetail inside
// the shared Sheet component. Closing always calls router.back() so the
// underlying list route (scroll position + filters) is left untouched.

import { usePathname, useRouter } from 'next/navigation'
import Sheet from '@/components/ui/Sheet'
import EventDetail from '@/components/events/EventDetail'
import type { Event } from '@/types'

interface EventDetailModalProps {
  event: Event
}

export default function EventDetailModal({ event }: EventDetailModalProps) {
  const router = useRouter()
  const pathname = usePathname()

  if (!pathname.startsWith('/eventos/')) return null

  return (
    <Sheet open variant="fullscreen" title={event.title} onClose={() => router.back()}>
      <EventDetail event={event} surface="modal" onClose={() => router.back()} />
    </Sheet>
  )
}
