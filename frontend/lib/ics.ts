// ─────────────────────────────────────────────
// lib/ics.ts
// Client-side .ics (iCalendar) file generation for "add to calendar".
// end_datetime from the backend is unreliable, so DTEND is always derived
// from start_datetime + CALENDAR_DEFAULT_DURATION_HOURS.
// ─────────────────────────────────────────────

import type { Event } from '@/types'

export const CALENDAR_DEFAULT_DURATION_HOURS = 1

function toIcsUtcDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function buildEventIcs(event: Event): string {
  const start = new Date(event.start_datetime)
  const end = new Date(start.getTime() + CALENDAR_DEFAULT_DURATION_HOURS * 60 * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guana Go//Events//ES',
    'BEGIN:VEVENT',
    `UID:${event.id}@guanaknow.mx`,
    `DTSTAMP:${toIcsUtcDate(new Date())}`,
    `DTSTART:${toIcsUtcDate(start)}`,
    `DTEND:${toIcsUtcDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.venue_name)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

export function downloadEventIcs(event: Event): void {
  const ics = buildEventIcs(event)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${event.slug}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
