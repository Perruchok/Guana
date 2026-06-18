export const metadata = {
  title: 'Eliminación de Datos de Usuario',
  description: 'Instrucciones para solicitar la eliminación de datos y desconectar Instagram en Guana Go.',
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

export default function EliminarDatosPage() {
  return (
    <main style={pageStyles}>
      <h1 style={titleStyles}>Eliminación de Datos de Usuario</h1>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>1. Instrucciones</h2>
        <p style={paragraphStyles}>
          Envíe un correo a <a href="mailto:privacidad@guanago.mx">privacidad@guanago.mx</a> con el asunto
          &quot;Eliminación de datos&quot;. Incluya el correo de la cuenta o el usuario de Instagram conectado. La solicitud
          se atiende en un plazo de 30 días hábiles.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>2. Desconexión inmediata de Instagram</h2>
        <p style={paragraphStyles}>
          Desde el panel en <a href="https://guanago.mx/dashboard">guanago.mx/dashboard</a> puede eliminar el acceso
          a los datos de Instagram de forma inmediata.
        </p>
      </section>

      <section style={sectionStyles}>
        <h2 style={headingStyles}>3. Eliminación de cuenta</h2>
        <p style={paragraphStyles}>
          La eliminación de la cuenta incluye la eliminación de todos los datos asociados y es irreversible.
        </p>
      </section>
    </main>
  )
}
