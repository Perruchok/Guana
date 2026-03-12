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

  return (
    <div className="space-y-4">
      <h2 className="font-mono-gk text-sm text-stone uppercase tracking-wide">
        Cómo llegar
      </h2>

      {/* Map or placeholder */}
      <div className="w-full h-96 rounded-sm bg-pale border border-border overflow-hidden">
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-pale p-6">
            <p className="text-stone text-center mb-4">{venueName}</p>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-terracota text-cream rounded-sm hover:bg-[#a84e23] transition-colors font-medium text-sm"
            >
              Ver en Google Maps →
            </a>
          </div>
        )}
      </div>

      {/* Address text with link */}
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-terracota flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-ink text-sm mb-2">
            {address}, {city}
          </p>
        </div>
      </div>
    </div>
  )
}
