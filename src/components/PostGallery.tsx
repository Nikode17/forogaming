'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PostLightbox from './PostLightbox'

interface GalleryImage {
  id: string
  url: string
  position: number
}

interface PostGalleryProps {
  images: GalleryImage[]
}

const SWIPE_THRESHOLD_PX = 50
const MAX_DOTS = 8

export default function PostGallery({ images }: PostGalleryProps) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const total = images.length
  const hasMultiple = total > 1
  const isFirst = index === 0
  const isLast = index === total - 1

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => (i < total - 1 ? i + 1 : i))
  }, [total])

  // Teclado SOLO cuando el lightbox NO está abierto (cuando se abre, su listener toma control)
  useEffect(() => {
    if (!hasMultiple || lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMultiple, lightboxOpen, goPrev, goNext])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (total === 0) return null

  const current = images[index]
  const showDots = hasMultiple && total <= MAX_DOTS

  return (
    <>
      <div
        className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden select-none"
        role="region"
        aria-label={`Galería de imágenes, ${total} en total`}
        onTouchStart={hasMultiple ? onTouchStart : undefined}
        onTouchEnd={hasMultiple ? onTouchEnd : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.url}
          alt=""
          className="w-full h-full object-cover cursor-zoom-in"
          draggable={false}
          onClick={() => setLightboxOpen(true)}
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              aria-label="Imagen anterior"
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm ${
                isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              aria-label="Imagen siguiente"
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm ${
                isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Contador arriba derecha */}
            <div
              className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm tabular-nums"
              aria-live="polite"
            >
              {index + 1} / {total}
            </div>

            {/* Dots abajo centrados, solo si total <= MAX_DOTS */}
            {showDots && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2"
                role="tablist"
                aria-label="Selector de imagen"
              >
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ir a imagen ${i + 1}`}
                    aria-selected={i === index}
                    role="tab"
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === index ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lightboxOpen && (
        <PostLightbox
          images={images}
          initialIndex={index}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
