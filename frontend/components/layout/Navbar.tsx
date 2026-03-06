'use client'
// components/layout/Navbar.tsx

import Link from 'next/link'
import { tokenStore } from '@/lib/auth'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(tokenStore.isLoggedIn())
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-border h-[60px] flex items-center justify-between px-6 md:px-10">
      <Link
        href="/"
        className="font-display text-[1.35rem] font-black tracking-tight text-ink"
      >
        Guana
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/directorio"
          className="text-stone hover:text-terracota text-xs font-medium tracking-widest uppercase transition-colors px-3 py-2"
        >
          Directorio
        </Link>

        {loggedIn ? (
          <Link
            href="/dashboard"
            className="text-xs font-medium tracking-widest uppercase border border-ink px-4 py-2 rounded-sm hover:bg-ink hover:text-cream transition-colors"
          >
            Mi cuenta
          </Link>
        ) : (
          <>
            <Link
              href="/registro"
              className="text-xs font-medium tracking-widest uppercase border border-ink px-4 py-2 rounded-sm hover:bg-ink hover:text-cream transition-colors"
            >
              Regístrate
            </Link>
            <Link
              href="/entrar"
              className="text-xs font-medium tracking-widest uppercase bg-terracota text-cream border border-terracota px-4 py-2 rounded-sm hover:bg-[#a84e23] transition-colors"
            >
              Entrar
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
