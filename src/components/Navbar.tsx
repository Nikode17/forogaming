'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function Navbar() {
  const { user, isLoading } = useAuth()
  const { toggleMobile } = useSidebar()
  const { openLogin, openRegister } = useAuthModal()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      {/* Layout 3 zonas: izquierda (logo+hamburguesa) | centro (search) | derecha (acciones) */}
      <div className="flex items-center gap-4 px-6 h-14">

        {/* ── IZQUIERDA ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hamburguesa móvil */}
          <button
            type="button"
            onClick={toggleMobile}
            aria-label="Abrir menú"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Logo — sin outline al recibir foco (browser default) */}
          <Link
            href="/"
            className="flex items-center hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Respawn" className="h-10 w-auto" />
          </Link>
        </div>

        {/* ── CENTRO: barra de búsqueda centrada ── */}
        <div className="flex-1 flex justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar posts, juegos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </form>
        </div>

        {/* ── DERECHA ── */}
        {/* La zona de usuario logueado vive ahora en la sidebar (SidebarUserZone).
            Este div se mantiene aunque esté vacío para que el flex centre bien la búsqueda. */}
        <div className="flex items-center gap-1 flex-shrink-0 min-w-[1px]">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              <div className="w-20 h-4 rounded bg-gray-700 animate-pulse" />
            </div>
          ) : user ? (
            /* Logueado: nada en la navbar — la zona usuario está en la sidebar */
            null
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={openRegister}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition-colors"
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
