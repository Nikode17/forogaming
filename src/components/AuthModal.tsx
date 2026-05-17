'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '@/contexts/AuthModalContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthModal() {
  const router = useRouter()
  const { mode, close, switchMode } = useAuthModal()
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const isOpen = mode !== null

  // Body scroll lock + ESC + restaurar focus al cerrar
  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      // Restaurar focus al elemento que lo tenía antes de abrir el modal
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen, close])

  if (!isOpen) return null

  const onSuccess = () => {
    close()
    router.refresh()
  }

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onBackdropClick}
    >
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-8">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {mode === 'login' ? (
          <LoginForm embedded onSuccess={onSuccess} onSwitchToRegister={switchMode} />
        ) : (
          <RegisterForm embedded onSuccess={onSuccess} onSwitchToLogin={switchMode} />
        )}
      </div>
    </div>
  )
}
