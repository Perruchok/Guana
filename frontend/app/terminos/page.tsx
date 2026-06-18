export const metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de Guana Go, directorio cultural de Guanajuato, México.',
}

const pageStyles: React.CSSProperties = {
  maxWidth: '700px',
  margin: '60px auto 0',
  padding: '0 24px 48px',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#000000',
  backgroundColor: '#ffffff',
  lineHeight: 1.65,
}

const titleStyles: React.CSSProperties = {
  fontSize: '2.25rem',
  lineHeight: 1.1,
  margin: '0 0 24px',
  fontWeight: 700,
}

const sectionStyles: React.CSSProperties = {
  marginTop: '28px',
}

const headingStyles: React.CSSProperties = {
  fontSize: '1.35rem',
  lineHeight: 1.25,
  margin: '0 0 12px',
  fontWeight: 700,
}

const paragraphStyles: React.CSSProperties = {
  margin: '0 0 12px',
}

export default function TerminosPage() {
  return (
    <main style={pageStyles}>
      <h1 style={titleStyles}>Términos y Condiciones</h1>
      <p style={paragraphStyles}>
        Plataforma: Guana Go. Última actualización: junio 2026. Contacto:{' '}
        <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a>
      </p>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>1. Uso de la plataforma</h2>
        <p style={paragraphStyles}>
          Guana Go es un directorio cultural de Guanajuato, México. El uso de la plataforma es bajo la
          responsabilidad del usuario.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>2. Cuentas de propietarios</h2>
        <p style={paragraphStyles}>
          Los propietarios de establecimientos son responsables de la veracidad del contenido que publican.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>3. Contenido generado por IA</h2>
        <p style={paragraphStyles}>
          Los borradores de eventos generados automáticamente son sugerencias. El propietario es responsable de
          revisar y aprobar el contenido antes de publicarlo.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>4. Propiedad intelectual</h2>
        <p style={paragraphStyles}>
          El contenido de la plataforma es propiedad de Guana Go o de sus respectivos autores.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>5. Limitación de responsabilidad</h2>
        <p style={paragraphStyles}>
          Guana Go no garantiza la exactitud de los eventos listados.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>6. Modificaciones</h2>
        <p style={paragraphStyles}>
          Guana Go puede modificar estos términos en cualquier momento con aviso previo en la plataforma.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>7. Contacto</h2>
        <p style={paragraphStyles}>
          Para dudas sobre estos términos, escriba a <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a>.
        </p>
      </section>
    </main>
  )
}
