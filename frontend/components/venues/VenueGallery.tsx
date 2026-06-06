'use client'

import { useState } from 'react'
import Image from 'next/image'

interface VenueGalleryProps {
  images: string[]
}

function tileClasses(index: number, total: number) {
  if (total === 1) {
    return 'col-span-2 row-span-2 h-96'
  }

  if (total === 2) {
    return 'h-72'
  }

  if (index === 0) {
    return 'col-span-2 h-80'
  }

  return 'h-40 sm:h-48'
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelectedIndex(null)
    } else if (event.key === 'ArrowLeft') {
      handlePrevious()
    } else if (event.key === 'ArrowRight') {
      handleNext()
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className={`group relative overflow-hidden rounded-xl bg-slate-200 text-left ${tileClasses(index, images.length)}`}
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={image}
              alt={`Galeria ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized={true}
            />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/90 backdrop-blur"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          role="dialog"
          tabIndex={-1}
        >
          <div className="relative flex h-full w-full items-center justify-center p-4">
            <button
              type="button"
              className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close lightbox"
            >
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-xl"
              onClick={(event) => event.stopPropagation()}
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

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-6 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="absolute right-6 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-brand-navy/70 px-3 py-1">
                <p className="text-sm font-medium text-white">
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
