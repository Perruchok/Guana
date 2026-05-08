// components/layout/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-brand-navy px-6 py-10 text-white md:px-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
            GUANA GO!
          </Link>
          <p className="mt-1 text-xs text-slate-400">Agenda Cultural de la Ciudad</p>

          <div className="mt-4 flex items-center gap-2">
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="h-8 w-8 cursor-pointer rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-white" aria-hidden="true">
                <path d="M16.5 3c.3 1.7 1.3 3 2.9 3.8.9.5 1.9.7 2.6.7v3.1c-1.2 0-2.3-.2-3.4-.7-.7-.3-1.3-.8-1.8-1.2v6.5a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .8.1v3.2a2.6 2.6 0 1 0 1.9 2.5V3h2.7z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-8 w-8 cursor-pointer rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full text-white" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>

            <a
              href="https://wa.me/527282843125"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-8 w-8 cursor-pointer rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full text-white" aria-hidden="true">
                <path d="M20 11.8A8 8 0 1 0 5.4 16l-1 3.7 3.9-1a8 8 0 0 0 11.7-6.9zM9.6 8.7c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.8 1.9c.1.3.1.4 0 .6l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.2 1.4 1.9.9.9 1.6 1.2 2.1 1.4.2.1.4 0 .5-.1l.5-.6c.1-.1.3-.2.6-.1l1.8.8c.3.1.4.3.4.5v.5c0 .2-.1.4-.4.6-.4.2-1 .4-1.6.4-1 0-2.3-.4-4.1-2.1-2-1.8-2.6-3.3-2.6-4.4 0-.6.2-1.2.5-1.6z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">FAQS</p>
          <Link href="/quienes-somos" className="mb-2 block text-sm text-slate-300 transition-colors hover:text-white">
            Quiénes somos
          </Link>
          <Link href="/registro" className="mb-2 block text-sm text-slate-300 transition-colors hover:text-white">
            Cómo registrarse
          </Link>
          <Link href="/blog" className="mb-2 block text-sm text-slate-300 transition-colors hover:text-white">
            Blog
          </Link>
          <Link href="/newsletter" className="mb-2 block text-sm text-slate-300 transition-colors hover:text-white">
            Suscríbete a nuestro newsletter
          </Link>
        </div>

        <div>
          <p className="text-sm text-slate-300">Tel. 728 284 3125</p>
          <p className="text-sm text-slate-400">Ext. 159</p>
          <p className="mt-2 text-xs text-slate-400">Lunes a Viernes de 9:00 am a 6:00 pm</p>
          <p className="text-xs text-slate-500">*Excepto días festivos</p>
          <Link href="/contacto" className="mt-2 block text-sm text-brand-blue hover:underline">
            Contáctanos
          </Link>
        </div>

        <div>
          <a href="mailto:contacto@guanago.mx" className="text-sm text-slate-300 hover:text-white">
            contacto@guanago.mx
          </a>
          <p className="mt-3 text-sm text-slate-300">Tel. 728 284 3125</p>
          <p className="text-sm text-slate-400">Ext. 159</p>
          <p className="mt-2 text-xs text-slate-400">Lunes a Viernes de 9:00 am a 6:00 pm</p>
          <p className="text-xs text-slate-500">*Excepto días festivos</p>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-4 pb-6 text-xs text-slate-500 md:flex md:items-center md:justify-between">
        <span>© 2025 Guana Go. Todos los derechos reservados.</span>
        <div className="mt-2 md:mt-0">
          <Link href="/privacidad" className="hover:text-slate-300">
            Aviso de privacidad
          </Link>
          <span className="mx-2">·</span>
          <Link href="/terminos" className="hover:text-slate-300">
            Términos y condiciones
          </Link>
        </div>
      </div>
    </footer>
  )
}
