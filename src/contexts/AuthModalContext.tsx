'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type AuthModalMode = 'login' | 'register' | null

interface AuthModalContextValue {
  mode: AuthModalMode
  openLogin: () => void
  openRegister: () => void
  close: () => void
  switchMode: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode>(null)
  const openLogin    = useCallback(() => setMode('login'), [])
  const openRegister = useCallback(() => setMode('register'), [])
  const close        = useCallback(() => setMode(null), [])
  const switchMode   = useCallback(() => setMode((m) => (m === 'login' ? 'register' : m === 'register' ? 'login' : m)), [])

  return (
    <AuthModalContext.Provider value={{ mode, openLogin, openRegister, close, switchMode }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
