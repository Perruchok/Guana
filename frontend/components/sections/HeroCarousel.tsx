'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  title: string
  subtitle: string
  imageUrl: string
  ctaLabel?: string
  ctaHref?: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
}

function splitTitle(title: string): { firstLine: string; secondLine: string | null } {
  const [firstLineRaw, ...rest] = title.split('\n')
  const firstLine = firstLineRaw?.trim() ?? ''
  const secondLineText = rest.join(' ').trim()

  if (!secondLineText) {
    return { firstLine, secondLine: null }
  }

  return { firstLine, secondLine: secondLineText }
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (slides.length <= 1 || isHovered) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % slides.length)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isHovered, slides.length])

  if (slides.length === 0) {
    return null
  }

  const goToPreviousSlide = () => {
    setCurrentIndex((previousIndex) => (previousIndex - 1 + slides.length) % slides.length)
  }

  const goToNextSlide = () => {
    setCurrentIndex((previousIndex) => (previousIndex + 1) % slides.length)
  }

  return (
    <section
      className="relative mx-6 mt-6 h-[480px] w-auto overflow-hidden rounded-3xl md:mx-10 md:h-[600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {slides.map((slide, index) => {
        const { firstLine, secondLine } = splitTitle(slide.title)
        const isActive = index === currentIndex

        return (
          <div
            key={`${slide.title}-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isActive}
          >
            <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" priority={index === 0} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            <div className="absolute bottom-12 left-8 max-w-xl md:left-16">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">
                AGENDA CULTURAL DE GUANAJUATO
              </p>
              <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white md:text-6xl">
                <span className="block not-italic">{firstLine}</span>
                {secondLine && <span className="block italic">{secondLine}</span>}
              </h1>
              <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">{slide.subtitle}</p>

              {slide.ctaLabel && (
                <Link
                  href={slide.ctaHref ?? '#'}
                  className="mt-6 inline-flex rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
                >
                  {slide.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        aria-label="Slide anterior"
        onClick={goToPreviousSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        aria-label="Slide siguiente"
        onClick={goToNextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex

          return (
            <button
              key={`${slide.title}-dot-${index}`}
              type="button"
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                isActive ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/40'
              }`}
            />
          )
        })}
      </div>
    </section>
  )
}
