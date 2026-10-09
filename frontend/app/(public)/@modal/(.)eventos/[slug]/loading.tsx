'use client'
// app/(public)/@modal/(.)eventos/[slug]/loading.tsx
// Shown instantly while the server fetches the event detail, so the sheet
// opens immediately instead of waiting on the network.

import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import Sheet from '@/components/ui/Sheet'

export default function EventDetailModalLoading() {
  const router = useRouter()
  const pathname = usePathname()

  if (!pathname.startsWith('/eventos/')) return null

  return (
    <Sheet open variant="fullscreen" title="Cargando evento…" onClose={() => router.back()}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-slate-200 px-2 pt-[env(safe-area-inset-top)] md:pt-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Cerrar"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      <div className="flex flex-col gap-4 p-4" aria-hidden="true">
        <div className="h-[40dvh] w-full animate-pulse rounded-xl bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      </div>
    </Sheet>
  )
}
