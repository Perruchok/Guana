// app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import RemoveUndefinedStyle from './RemoveUndefinedStyle.client'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700', '900'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
})

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
    <html
      lang="es"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="bg-cream text-ink font-sans antialiased">
        <RemoveUndefinedStyle />
        {children}
      </body>
    </html>
  )
}
