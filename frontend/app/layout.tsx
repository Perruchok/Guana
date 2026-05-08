// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import RemoveUndefinedStyle from './RemoveUndefinedStyle.client'

export const metadata: Metadata = {
  title: {
    default: 'Guana — Agenda Cultural de Guanajuato',
    template: '%s | Guana',
  },
  description: 'Descubre eventos culturales, conciertos, exposiciones y más en Guanajuato, México.',
  keywords: ['Guanajuato', 'eventos', 'cultura', 'agenda', 'conciertos', 'exposiciones'],
  openGraph: {
    title: 'Guana',
    description: 'La agenda cultural de Guanajuato',
    locale: 'es_MX',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-brand-bg text-gray-900 font-sans antialiased">
        <RemoveUndefinedStyle />
        {children}
      </body>
    </html>
  )
}
