'use client'
// components/events/ShareSheet.tsx
// Fallback share options shown when navigator.share is unavailable.

import { useState } from 'react'
import { MessageCircle, Copy, Check } from 'lucide-react'
import Sheet from '@/components/ui/Sheet'

interface ShareSheetProps {
  open: boolean
  title: string
  url: string
  onClose: () => void
}

export default function ShareSheet({ open, title, url, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      onClose()
    }, 900)
  }

  return (
    <Sheet open={open} title="Compartir evento" onClose={onClose}>
      <div className="flex flex-col gap-2 py-4">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:border-slate-400"
        >
          <MessageCircle size={18} className="text-brand-blue" aria-hidden="true" />
          Compartir por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => { void handleCopyLink() }}
          className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:border-slate-400"
        >
          {copied ? (
            <Check size={18} className="text-green-600" aria-hidden="true" />
          ) : (
            <Copy size={18} className="text-brand-blue" aria-hidden="true" />
          )}
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
    </Sheet>
  )
}
