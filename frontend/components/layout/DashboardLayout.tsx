// components/layout/DashboardLayout.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { tokenStore } from '@/lib/auth'
import type { User } from '@/types'

interface Props {
  children: React.ReactNode
  user: User
}

export default function DashboardLayout({ children, user }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    tokenStore.clear()
    router.push('/')
  }

  // Detect active tab
  const tabs = [
    { label: 'Mis Eventos', href: '/dashboard/eventos' },
    { label: 'Mi Lugar', href: '/dashboard/perfil' },
    { label: 'Suscripción', href: '/dashboard/suscripcion' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex flex-col h-screen bg-brand-bg">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-navy border-b border-white/10">
        <div className="flex items-center px-6 py-3 h-[72px] max-w-full w-full">
          {/* Logo: always left */}
          <Link href="/" className="font-extrabold tracking-tight text-xl text-white">
            GUANA GO!
          </Link>

          {/* Tabs: next to logo (or centered by layout) */}
          <div className="flex items-center gap-8 ml-8">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`text-sm font-medium transition-colors pb-2 border-b-2 ${
                  isActive(tab.href)
                    ? 'text-white border-brand-blue'
                    : 'text-slate-400 border-b-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Right: avatar + salir, always flush right using ml-auto */}
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              title="Cerrar sesión"
            >
              <div className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center font-bold">
                {user.first_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile tab scroll (visible on small screens) */}
        <div className="md:hidden overflow-x-auto border-t border-white/10 px-4">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-shrink-0 text-sm font-medium py-3 border-b-2 transition-colors ${
                  isActive(tab.href)
                    ? 'text-white border-brand-blue'
                    : 'text-slate-400 border-b-transparent'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-6 py-8 md:py-12">
          {/* Top greeting + banner */}
          <div className="mb-8">
            <h1 className="font-bold text-2xl text-gray-900 mb-6">
              Hola, {user.first_name}
            </h1>
            
            {/* Free plan banner */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-sm flex items-center justify-between">
              <div>
                <p className="font-medium">Plan Gratuito</p>
                <p className="text-xs text-blue-700 mt-1">Tienes acceso a 1 lugar y 10 eventos/mes</p>
              </div>
              <Link
                href="/dashboard/suscripcion"
                className="text-blue-700 hover:underline text-xs font-medium ml-4 whitespace-nowrap"
              >
                Ver planes →
              </Link>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
