'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  kind?: 'event' | 'ad'
  imageUrl: string
  mobileImageUrl?: string
  imageAlt?: string
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  href?: string
  showOverlay?: boolean
}

interface HeroCarouselProps {
  slides: HeroSlide[]
}

function splitTitle(title?: string): { firstLine: string; secondLine: string | null } {
  if (!title) {
    return { firstLine: '', secondLine: null }
  }

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
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const suppressTapRef = useRef(false)

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

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]

    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    setDragOffset(0)
    suppressTapRef.current = false
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    const touchStartX = touchStartXRef.current
    const touchStartY = touchStartYRef.current
    const touch = event.touches[0]

    if (touchStartX === null || touchStartY === null) {
      return
    }

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      setDragOffset(0)
      return
    }

    setDragOffset(Math.max(-120, Math.min(120, deltaX * 0.35)))

    if (Math.abs(deltaX) > 12) {
      suppressTapRef.current = true
    }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const touchStartX = touchStartXRef.current
    const touchStartY = touchStartYRef.current
    const touch = event.changedTouches[0]

    touchStartXRef.current = null
    touchStartYRef.current = null
    setDragOffset(0)

    if (touchStartX === null || touchStartY === null) {
      return
    }

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    const isHorizontalSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)

    if (!isHorizontalSwipe) {
      return
    }

    suppressTapRef.current = true

    if (deltaX > 0) {
      goToPreviousSlide()
      return
    }

    goToNextSlide()
  }

  const handleTouchCancel = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
    setDragOffset(0)
    suppressTapRef.current = false
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if (!suppressTapRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    suppressTapRef.current = false
  }

  return (
    <section
      className="relative mx-6 mt-6 aspect-square w-auto overflow-hidden rounded-3xl md:mx-10 md:h-[600px] md:aspect-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClickCapture={handleClickCapture}
      style={{ touchAction: 'pan-y' }}
    >
      {slides.map((slide, index) => {
        const { firstLine, secondLine } = splitTitle(slide.title)
        const isActive = index === currentIndex
        const isAdSlide = slide.kind === 'ad'
        const showOverlay = slide.showOverlay ?? !isAdSlide
        const imageAlt = slide.imageAlt ?? slide.title ?? `Slide ${index + 1}`
        const mobileImageUrl = slide.mobileImageUrl ?? slide.imageUrl
        const hasTextContent = Boolean(slide.title || slide.subtitle || slide.ctaLabel)

        return (
          <div
            key={`${slide.imageUrl}-${index}`}
            className={`absolute inset-0 ${
              isActive ? 'transition-transform duration-200 ease-out transition-opacity duration-500' : 'transition-opacity duration-500'
            } ${
              isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isActive}
            style={isActive ? { transform: `translateX(${dragOffset}px)` } : undefined}
          >
            {slide.mobileImageUrl ? (
              <picture>
                <source media="(max-width: 767px)" srcSet={mobileImageUrl} />
                <img src={slide.imageUrl} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} />
              </picture>
            ) : (
              <Image src={slide.imageUrl} alt={imageAlt} fill className="object-cover" priority={index === 0} />
            )}
            {showOverlay && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />}

            {slide.href && (
              <Link href={slide.href} className="absolute inset-0 z-10" aria-label={slide.title ?? 'Abrir promoción'}>
                <span className="sr-only">Abrir promoción</span>
              </Link>
            )}

            {hasTextContent && (
              <div className="absolute bottom-12 left-8 z-20 max-w-xl md:left-16">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">
                  {isAdSlide ? 'PUBLICIDAD' : 'AGENDA CULTURAL DE GUANAJUATO'}
                </p>
                {slide.title && (
                  <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white md:text-6xl">
                    <span className="block not-italic">{firstLine}</span>
                    {secondLine && <span className="block italic">{secondLine}</span>}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">{slide.subtitle}</p>
                )}

                {slide.ctaLabel && (
                  <Link
                    href={slide.ctaHref ?? slide.href ?? '#'}
                    className="mt-6 inline-flex rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-light"
                  >
                    {slide.ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        aria-label="Slide anterior"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          goToPreviousSlide()
        }}
        className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        aria-label="Slide siguiente"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          goToNextSlide()
        }}
        className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex

          return (
            <button
              key={`${slide.imageUrl}-dot-${index}`}
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
