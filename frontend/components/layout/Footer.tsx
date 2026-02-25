// components/layout/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <footer className="bg-ink text-cream grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-10 py-10 border-t border-border">
        <div>
          <Link href="/" className="font-display text-[1.35rem] font-black tracking-tight">
            Guana<span className="text-gold">·</span>Know
          </Link>
          <p className="text-stone text-sm mt-3 leading-relaxed">
            La agenda cultural de Guanajuato.<br />
            Hecho con ♥ en Gto.
          </p>
        </div>

        <div>
          <p className="label text-stone mb-4">Navegación</p>
          <ul className="space-y-2">
            {[
              { href: '/',           label: 'Inicio' },
              { href: '/directorio', label: 'Directorio' },
              { href: '/registro',   label: 'Regístrate' },
              { href: '/entrar',     label: 'Entrar' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-[#D6CEBC] text-sm hover:text-cream transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label text-stone mb-4">Contacto</p>
          <ul className="space-y-2">
            <li>
              <a href="mailto:hola@guanaknow.mx" className="text-[#D6CEBC] text-sm hover:text-cream transition-colors">
                hola@guanaknow.mx
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D6CEBC] text-sm hover:text-gold transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </footer>

      <div className="bg-ink border-t border-[#2A2420] px-6 md:px-10 py-4 flex justify-between items-center">
        <span className="text-stone text-xs">© 2025 Guana Know. Todos los derechos reservados.</span>
      </div>
    </>
  )
}
