'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface AuthUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'user' | 'guest'
  avatar_url: string | null
}

interface AuthContextType {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al montar, intentar restaurar sesión con refresh token (httpOnly cookie)
  const restoreSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as { accessToken: string }
        setAccessToken(data.accessToken)
        // Decodificar payload del JWT para obtener info básica del usuario
        const payload = JSON.parse(atob(data.accessToken.split('.')[1])) as {
          sub: string; username: string; role: AuthUser['role']
        }
        setUser({ id: payload.sub, username: payload.username, role: payload.role, email: '', avatar_url: null })
      }
    } catch {
      // No hay sesión activa
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { restoreSession() }, [restoreSession])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { user?: AuthUser; accessToken?: string; error?: { message: string } }
    if (!res.ok) throw new Error(data.error?.message ?? 'Error al iniciar sesión')
    setUser(data.user!)
    setAccessToken(data.accessToken!)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    setAccessToken(null)
  }

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    })
    const data = await res.json() as { user?: AuthUser; accessToken?: string; error?: { message: string } }
    if (!res.ok) throw new Error(data.error?.message ?? 'Error al registrarse')
    setUser(data.user!)
    setAccessToken(data.accessToken!)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
