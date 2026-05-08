// app/(dashboard)/dashboard/suscripcion/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { subscriptions } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import type { Plan, Subscription } from '@/types'

export default function SuscripcionPage() {
  const token = tokenStore.getAccess()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subError, setSubError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      setLoading(true)
      setSubError(null)
      try {
        let subErr = false
        const [plansRes, subRes] = await Promise.all([
          subscriptions.plans(),
          subscriptions.me(token).catch(() => {
            subErr = true
            return null
          }),
        ])
        setPlans(plansRes)
        if (subRes) {
          setSubscription(subRes)
        } else {
          // fallback to free plan for unknown subscription
          setSubscription({ plan: 'free', status: 'active' } as Subscription)
        }
        if (subErr) {
          setSubError('No encontramos tu suscripción. Contacta a soporte si el problema persiste.')
        }
      } catch (err) {
        setError('Error al cargar planes')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const handleUpgrade = async (planId: string) => {
    if (!token) return
    setError(null)
    setUpgrading(planId)

    try {
      const newSub = await subscriptions.upgrade(token, planId)
      setSubscription(newSub)
      alert('¡Suscripción actualizada exitosamente!')
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>
      const msg = e.detail || Object.values(e).flat()[0] || 'Error al actualizar suscripción.'
      setError(String(msg))
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) {
    return <div className="text-center text-slate-500">Cargando planes...</div>
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-extrabold tracking-tight text-3xl text-gray-900 mb-2">
          Planes y precios
        </h1>
        <p className="text-slate-500">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}
      {subError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-sm mb-6">
          {subError}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id
          const planFeatures: Record<string, string[]> = {
            free: [
              '1 lugar',
              '10 eventos/mes',
              'Análisis básico',
              'Soporte por email',
            ],
            basic: [
              '3 lugares',
              '30 eventos/mes',
              'Análisis avanzado',
              'Soporte prioritario',
            ],
            pro: [
              '10 lugares',
              '100 eventos/mes',
              'Análisis ilimitado',
              'Soporte prioritario 24/7',
            ],
          }

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-sm border-2 p-6 md:p-8 flex flex-col transition-all ${
                isCurrentPlan
                  ? 'border-brand-blue shadow-lg'
                  : 'border-slate-200 hover:border-slate-200'
              }`}
            >
              {/* Plan header */}
              {isCurrentPlan && (
                <div className="text-xs font-medium text-brand-blue-light tracking-widest uppercase mb-3">
                  ✓ Plan actual
                </div>
              )}

              <h3 className="font-bold tracking-tight text-xl text-gray-900 mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-6">
                <span className="font-extrabold tracking-tight text-3xl text-gray-900">
                  ${plan.price_monthly.toLocaleString('es-MX')}
                </span>
                <span className="text-slate-500 text-sm">/mes</span>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-8 flex-1">
                {(planFeatures[plan.id] || []).map((feature, i) => (
                  <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                    <span className="text-brand-blue-light mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full bg-slate-50 text-slate-500 py-3 rounded-sm font-medium cursor-default"
                >
                  Plan actual
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                  className="w-full bg-brand-navy text-white py-3 rounded-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {upgrading === plan.id ? 'Actualizando...' : 'Actualizar'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Info note */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 text-center">
        <p className="text-sm text-slate-500">
          Los pagos con tarjeta estarán disponibles próximamente.{' '}
          <a href="mailto:hola@guana.mx" className="text-brand-blue-light hover:underline font-medium">
            Contáctanos
          </a>{' '}
          para activar tu plan.
        </p>
      </div>
    </div>
  )
}
