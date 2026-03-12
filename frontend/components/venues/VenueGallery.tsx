'use client'

import { useState } from 'react'
import Image from 'next/image'

interface VenueGalleryProps {
  images: string[]
}

export default function VenueGallery({ images }: VenueGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!images || images.length === 0) {
    return null
  }

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedIndex(null)
    } else if (e.key === 'ArrowLeft') {
      handlePrevious()
    } else if (e.key === 'ArrowRight') {
      handleNext()
    }
  }

  // Gallery layout based on image count
  const renderGallery = () => {
    if (images.length === 1) {
      return (
        <div className="w-full h-96 relative rounded-sm overflow-hidden bg-pale">
          <Image
            src={images[0]}
            alt="Gallery"
            fill
            className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setSelectedIndex(0)}
            priority
            unoptimized={true}
          />
        </div>
      )
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="h-72 relative rounded-sm overflow-hidden bg-pale"
            >
              <Image
                src={img}
                alt={`Gallery ${i + 1}`}
                fill
                className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setSelectedIndex(i)}
                unoptimized={true}
              />
            </div>
          ))}
        </div>
      )
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 h-72 relative rounded-sm overflow-hidden bg-pale">
            <Image
              src={images[0]}
              alt="Gallery 1"
              fill
              className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setSelectedIndex(0)}
              priority
              unoptimized={true}
            />
          </div>
          <div className="flex flex-col gap-2">
            {images.slice(1, 3).map((img, i) => (
              <div key={i} className="h-35 relative rounded-sm overflow-hidden bg-pale flex-1">
                <Image
                  src={img}
                  alt={`Gallery ${i + 2}`}
                  fill
                  className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedIndex(i + 1)}
                  unoptimized={true}
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // 4+ images: masonry 2-column with first larger
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 h-72 relative rounded-sm overflow-hidden bg-pale">
          <Image
            src={images[0]}
            alt="Gallery 1"
            fill
            className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setSelectedIndex(0)}
            priority
            unoptimized={true}
          />
        </div>
        {images.slice(1).map((img, i) => (
          <div key={i} className="h-40 relative rounded-sm overflow-hidden bg-pale">
            <Image
              src={img}
              alt={`Gallery ${i + 2}`}
              fill
              className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setSelectedIndex(i + 1)}
              unoptimized={true}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="font-mono-gk text-sm text-stone uppercase tracking-wide">
          Galería
        </h2>
        {renderGallery()}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          role="dialog"
          tabIndex={-1}
        >
          {/* Image container */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              className="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center bg-cream/10 hover:bg-cream/20 rounded-sm transition-colors"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close lightbox"
            >
              <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main image */}
            <div
              className="relative w-full max-w-4xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex]}
                alt="Full size gallery"
                fill
                className="object-contain"
                priority
                unoptimized={true}
              />
            </div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center bg-cream/10 hover:bg-cream/20 rounded-sm transition-colors"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center bg-cream/10 hover:bg-cream/20 rounded-sm transition-colors"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-ink/70 px-3 py-1 rounded-sm">
                <p className="text-cream text-sm font-medium">
                  {selectedIndex + 1} / {images.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
