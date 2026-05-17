'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function GuestCTA() {
  const { user, isLoading } = useAuth()
  const { openLogin, openRegister } = useAuthModal()
  if (isLoading || user) return null

  return (
    <div className="relative mb-6 rounded-xl overflow-hidden border border-indigo-800/50 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950">
      {/* Decorative blur */}
      <div className="absolute right-0 top-0 w-64 h-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">
            Únete a la comunidad gamer
          </h2>
          <p className="text-sm text-indigo-300/80">
            Comparte guías, descubre easter eggs y debate sobre tus juegos favoritos.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openLogin}
            className="px-4 py-2 text-sm font-medium text-indigo-300 hover:text-white border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={openRegister}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Registrarse gratis
          </button>
        </div>
      </div>
    </div>
  )
}
