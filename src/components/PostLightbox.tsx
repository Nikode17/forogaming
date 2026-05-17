'use client'

import { useCallback, useEffect, useState } from 'react'

interface LightboxImage {
  id: string
  url: string
  position: number
}

interface PostLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export default function PostLightbox({ images, initialIndex, onClose }: PostLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const total = images.length
  const isFirst = index === 0
  const isLast = index === total - 1

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => (i < total - 1 ? i + 1 : i))
  }, [total])

  // Teclado: ←/→ navega, Escape cierra
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  // Body scroll lock mientras está abierto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Click en el backdrop (no en imagen ni botones) cierra
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const current = images[index]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imagen"
      onClick={onBackdropClick}
    >
      {/* Contador arriba centrado */}
      <div
        className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-base font-medium px-4 py-1.5 rounded-full backdrop-blur-sm tabular-nums"
        aria-live="polite"
      >
        {index + 1} / {total}
      </div>

      {/* Botón cerrar arriba derecha */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Imagen — click NO cierra (solo el backdrop) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.id}
        src={current.url}
        alt=""
        draggable={false}
        className="max-w-[95vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Flecha izquierda */}
      <button
        type="button"
        onClick={goPrev}
        disabled={isFirst}
        aria-label="Imagen anterior"
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm ${
          isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
        }`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Flecha derecha */}
      <button
        type="button"
        onClick={goNext}
        disabled={isLast}
        aria-label="Imagen siguiente"
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm ${
          isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
        }`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
