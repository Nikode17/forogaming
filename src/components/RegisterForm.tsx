'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Débil', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Media', color: 'bg-yellow-500' }
  if (score === 3) return { score, label: 'Fuerte', color: 'bg-green-500' }
  return { score, label: 'Muy fuerte', color: 'bg-emerald-400' }
}

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
  embedded?: boolean
}

export default function RegisterForm({ onSuccess, onSwitchToLogin, embedded = false }: RegisterFormProps) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const strength = getPasswordStrength(password)
  const validationErrors: string[] = []
  if (password.length > 0 && password.length < 8) validationErrors.push('Mínimo 8 caracteres')
  if (password.length > 0 && !/[A-Z]/.test(password)) validationErrors.push('Al menos 1 mayúscula')
  if (password.length > 0 && !/[0-9]/.test(password)) validationErrors.push('Al menos 1 número')
  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isPasswordValid) return
    setError(null)
    setIsLoading(true)
    try {
      await register(username, email, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  const formBody = (
    <>
      <div className="text-center mb-8">
        <h1 id="auth-modal-title" className="text-2xl font-bold text-white mb-2">Crear cuenta</h1>
        <p className="text-sm text-gray-400">Únete a la comunidad de Respawn</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reg-username" className="block text-sm font-medium text-gray-300 mb-1.5">
            Nombre de usuario
          </label>
          <input
            id="reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="TuNombre"
            minLength={3}
            maxLength={30}
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@email.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">
            Contraseña
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />

          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full ${level <= strength.score ? strength.color : 'bg-gray-700'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">Fuerza: {strength.label}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {validationErrors.map((err) => (
                    <li key={err} className="text-xs text-amber-400 flex items-center gap-1">
                      <span>•</span> {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isPasswordValid}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Creando cuenta…
            </span>
          ) : (
            'Crear cuenta'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline"
        >
          Inicia sesión
        </button>
      </p>
    </>
  )

  if (embedded) return formBody

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          {formBody}
        </div>
      </div>
    </div>
  )
}
