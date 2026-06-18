export const metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de privacidad de Guana Go sobre datos recopilados, uso, retención y derechos del usuario.',
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

const listStyles: React.CSSProperties = {
  margin: '0',
  paddingLeft: '20px',
}

export default function PrivacidadPage() {
  return (
    <main style={pageStyles}>
      <h1 style={titleStyles}>Aviso de Privacidad</h1>
      <p style={paragraphStyles}>
        Plataforma: Guana Go. Operador: Diego Mancera, Guanajuato, México. Última actualización: junio 2026.
        Contacto: <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a>
      </p>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>1. Datos que recopilamos</h2>
        <p style={paragraphStyles}>
          Recopilamos de forma voluntaria información de perfil y publicaciones de Instagram Business conectadas
          por el usuario, únicamente para identificar eventos culturales.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>2. Uso de los datos</h2>
        <p style={paragraphStyles}>
          Los datos se utilizan para generar borradores de eventos para revisión del propietario. No se comparten
          con terceros ni se usan con fines publicitarios.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>3. Retención</h2>
        <p style={paragraphStyles}>
          Conservamos los datos mientras la cuenta de Instagram permanezca conectada. El usuario puede desconectar
          la cuenta en cualquier momento desde su panel.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>4. Derechos del usuario (LFPDPPP)</h2>
        <p style={paragraphStyles}>
          Usted puede ejercer sus derechos de acceso, rectificación, cancelación y oposición escribiendo a{' '}
          <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a>.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>5. Contacto</h2>
        <p style={paragraphStyles}>
          Para cualquier asunto relacionado con este aviso de privacidad, escriba a{' '}
          <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a>.
        </p>
      </section>
    </main>
  )
}
