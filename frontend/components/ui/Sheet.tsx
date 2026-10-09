'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  variant?: 'bottom' | 'fullscreen'
}

let scrollLockCount = 0
let lockedHtmlOverflow = ''
let lockedBodyOverflow = ''

function lockScroll() {
  if (scrollLockCount++ === 0) {
    lockedHtmlOverflow = document.documentElement.style.overflow
    lockedBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }
}

function unlockScroll() {
  if (--scrollLockCount === 0) {
    document.documentElement.style.overflow = lockedHtmlOverflow
    document.body.style.overflow = lockedBodyOverflow
  }
}

const DIALOG_CLASSES = {
  bottom:
    'fixed inset-x-0 bottom-0 top-auto m-0 h-auto max-h-[75dvh] w-full max-w-none flex-col overflow-hidden rounded-t-xl border-0 bg-white p-0 text-gray-900 backdrop:bg-black/50 md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90dvh] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:shadow-lg',
  fullscreen:
    'sheet-slide-up fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 text-gray-900 backdrop:bg-black/50 md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[90dvh] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:shadow-lg',
}

export default function Sheet({ open, title, onClose, children, variant = 'bottom' }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    lockScroll()
    dialog.showModal()
    dialog.focus()

    return () => {
      if (dialog.open) dialog.close()
      unlockScroll()
      previouslyFocusedRef.current?.focus()
    }
  }, [open])

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const clickedOutside =
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    if (clickedOutside) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={variant === 'bottom' ? titleId : undefined}
      aria-label={variant === 'fullscreen' ? title : undefined}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={handleBackdropClick}
      className={`${open ? 'flex' : 'hidden'} ${DIALOG_CLASSES[variant]}`}
    >
      {variant === 'fullscreen' ? (
        children
      ) : (
        <div className="flex min-h-0 flex-1 flex-col pt-[max(1rem,env(safe-area-inset-top))] md:pt-0">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 pb-3 md:px-6 md:pt-4">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-gray-900"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
            {children}
          </div>
        </div>
      )}
    </dialog>
  )
}
