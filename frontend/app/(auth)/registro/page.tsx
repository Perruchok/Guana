 'use client'
// app/(auth)/registro/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { tokenStore } from '@/lib/auth'

type Step = 'tipo' | 'datos'

const USER_TYPES = [
  {
    id: 'business',
    icon: '🎪',
    title: 'Soy un negocio fijo y quiero publicar eventos constantemente',
    desc: 'Venues, espacios culturales, bares, etc.',
  },
  {
    id: 'business',
    icon: '🏪',
    title: 'Soy un negocio fijo y solo busco dar visibilidad a mi negocio',
    desc: 'Restaurantes, cafés, barberías, tiendas, etc.',
  },
  {
    id: 'business',
    icon: '🤝',
    title: 'Soy un colectivo o una organización sin ánimo de lucro',
    desc: 'ONGs, colectivos culturales, asociaciones.',
  },
  {
    id: 'individual',
    icon: '🎨',
    title: 'Soy independiente y quiero publicitar mis servicios',
    desc: 'Artistas, freelancers, creativos, etc.',
  },
]

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep]         = useState<Step>('tipo')
  const [selectedType, setSelectedType] = useState<typeof USER_TYPES[0] | null>(null)
  const [form, setForm]         = useState({
    username: '', email: '', password: '', password_confirm: '',
    first_name: '', last_name: '',
  })
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleTypeSelect = (type: typeof USER_TYPES[0]) => {
    setSelectedType(type)
    setStep('datos')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.password_confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await auth.register({
        ...form,
        user_type: (selectedType?.id ?? 'individual') as 'individual' | 'business',
      })
      const tokens = await auth.login(form.username, form.password)
      tokenStore.setTokens(tokens.access, tokens.refresh)
      router.push('/dashboard/onboarding')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = Object.values(e).flat()[0] ?? 'Error al crear la cuenta.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-12">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="font-extrabold tracking-tight text-2xl text-gray-900 block mb-10">
          Guana<span className="text-brand-blue-light">·</span>
        </Link>

        {step === 'tipo' && (
          <>
            <h1 className="font-bold tracking-tight text-2xl mb-1">Regístrate</h1>
            <p className="text-sm text-slate-500 mb-8">¿Qué tipo de usuario te describe mejor?</p>

            <div className="space-y-3">
              {USER_TYPES.map((type, i) => (
                <button
                  key={i}
                  onClick={() => handleTypeSelect(type)}
                  className="w-full text-left border border-slate-200 bg-white px-5 py-4 rounded-sm
                             hover:border-brand-blue hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900 group-hover:text-brand-blue-light transition-colors">
                        → {type.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-8">
              ¿Ya tienes cuenta?{' '}
              <Link href="/entrar" className="text-brand-blue-light hover:underline">Entrar</Link>
            </p>
          </>
        )}

        {step === 'datos' && (
          <>
            <button
              onClick={() => setStep('tipo')}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-gray-900 mb-6 transition-colors"
            >
              ← Volver
            </button>

            <h1 className="font-bold tracking-tight text-2xl mb-1">Cuéntanos de ti</h1>
            <p className="text-sm text-slate-500 mb-8">
              {selectedType?.title}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-medium text-slate-500">Nombre</label>
                  <input
                    required type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                    placeholder="Ana"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-medium text-slate-500">Apellido</label>
                  <input
                    required type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                    placeholder="López"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-xs font-medium text-slate-500">Nombre de usuario</label>
                <input
                  required type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                  placeholder="mi_negocio"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-medium text-slate-500">Correo electrónico</label>
                <input
                  required type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                  placeholder="hola@negocio.mx"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-medium text-slate-500">Contraseña</label>
                <input
                  required type="password" minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-medium text-slate-500">Confirmar contraseña</label>
                <input
                  required type="password" minLength={8}
                  value={form.password_confirm}
                  onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                  className="w-full border border-slate-200 bg-white px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-brand-blue"
                  placeholder="Repite tu contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white text-xs font-medium tracking-widest uppercase
                           py-3 rounded-sm hover:bg-brand-blue-light transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-6">
              Al registrarte recibirás automáticamente el plan gratuito.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
