interface VenueMapProps {
  address: string
  city: string
  venueName: string
  latitude?: string | null
  longitude?: string | null
}

export default function VenueMap({
  address,
  city,
  venueName,
  latitude,
  longitude,
}: VenueMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  
  // Build search query
  const searchQuery = `${venueName}, ${address}, ${city}, Mexico`
  const encodedQuery = encodeURIComponent(searchQuery)
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`
  
  // Build embed URL (use coordinates if available, otherwise use query)
  let embedUrl = ''
  if (apiKey && latitude && longitude) {
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}`
  } else if (apiKey) {
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`
  }

  const locationLabel = [address, city].filter(Boolean).join(', ')

  return (
    <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ubicacion</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Como llegar</h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-brand-bg">
        <div className="h-96 w-full">
          {apiKey && embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-brand-bg p-6 text-center">
              <p className="text-lg font-semibold text-gray-900">{venueName}</p>
              <p className="mt-2 max-w-md text-sm text-slate-500">Abre este lugar en Google Maps para obtener la ruta y revisar detalles de acceso.</p>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
              >
                Ver en Google Maps
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-slate-300 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Direccion</p>
          <p className="mt-2 text-sm text-gray-900">{locationLabel || 'Direccion disponible proximamente'}</p>
        </div>
      </div>
    </section>
  )
}
