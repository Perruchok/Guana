// app/(auth)/entrar/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { tokenStore } from '@/lib/auth'

export default function EntrarPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tokens = await auth.login(form.username, form.password)
      tokenStore.setTokens(tokens.access, tokens.refresh)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      let msg = 'Error al iniciar sesión.'
      if (e.detail) {
        msg = String(e.detail)
      } else if (Object.keys(e).length > 0) {
        msg = JSON.stringify(e, null, 2)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-12 flex items-center justify-center">
      <div className="max-w-sm w-full">
        <Link href="/" className="font-display font-black text-2xl text-ink block mb-10 text-center">
          Guana<span className="text-terracota">·</span>
        </Link>

        <h1 className="font-display font-bold text-2xl text-center mb-1">Entrar</h1>
        <p className="text-sm text-stone text-center mb-8">
          Accede a tu cuenta para publicar eventos
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
            <p className="font-medium mb-2">Error:</p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="label block mb-2">Nombre de usuario</label>
            <input
              required
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
              placeholder="tu_usuario"
              disabled={loading}
            />
            <p className="text-xs text-stone mt-1">💡 Usa tu nombre de usuario, no tu correo electrónico</p>
          </div>

          <div>
            <label className="label block mb-2">Contraseña</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-border bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-ink"
              placeholder="Tu contraseña"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracota text-cream font-medium py-3 rounded-sm hover:bg-[#a84e23] transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-stone">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-terracota hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
