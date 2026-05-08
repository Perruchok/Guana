'use client'
// components/layout/Navbar.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { tokenStore } from '@/lib/auth'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks: Array<{ href: string; label: string }> = [
    { href: '/', label: 'Inicio' },
    { href: '/cartelera', label: 'Cartelera' },
    { href: '/directorio', label: 'Directorio' },
  ]

  const isActiveLink = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/'
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const getNavLinkClassName = (href: string): string => {
    const baseClassName =
      'px-1 py-2 text-sm font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-gray-900 border-b-2 border-transparent'

    if (isActiveLink(href)) {
      return `${baseClassName} border-brand-blue text-brand-blue`
    }

    return baseClassName
  }

  const handleProfileClick = (): void => {
    if (tokenStore.isLoggedIn()) {
      router.push('/dashboard')
      return
    }

    router.push('/entrar')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-brand-bg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 leading-none text-gray-900">
          <div className="text-[2.1rem] font-extrabold uppercase tracking-tight">GUANA GOU!</div>
          <div className="-mt-1 text-[0.74rem] font-semibold uppercase tracking-wide text-gray-900">
            Agenda cultural de la ciudad
          </div>
        </Link>

        <div className="hidden h-full items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={getNavLinkClassName(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <label className="relative block">
            <span className="sr-only">Buscar</span>
            <input
              type="search"
              placeholder="Buscar"
              className="w-44 rounded-full bg-slate-200 py-1.5 pl-4 pr-9 text-xs font-semibold uppercase tracking-wide text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </label>

          <button
            type="button"
            aria-label="Perfil"
            onClick={handleProfileClick}
            className="rounded-md p-2 text-brand-blue transition-colors hover:text-brand-blue-light"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Calendario"
            className="rounded-md p-2 text-brand-blue transition-colors hover:text-brand-blue-light"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          className="rounded-md p-2 text-slate-500 transition-colors hover:text-gray-900 md:hidden"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-brand-bg px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={getNavLinkClassName(link.href)}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex items-center gap-3">
              <label className="relative block w-full">
                <span className="sr-only">Buscar</span>
                <input
                  type="search"
                  placeholder="Buscar"
                  className="w-full rounded-full bg-slate-200 py-1.5 pl-4 pr-9 text-xs font-semibold uppercase tracking-wide text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </label>

              <button
                type="button"
                aria-label="Perfil"
                onClick={() => {
                  setIsMenuOpen(false)
                  handleProfileClick()
                }}
                className="rounded-md p-2 text-brand-blue transition-colors hover:text-brand-blue-light"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Calendario"
                className="rounded-md p-2 text-brand-blue transition-colors hover:text-brand-blue-light"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
