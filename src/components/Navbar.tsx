'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

// SVG inline icons (mismo patrón que el resto del proyecto: sin lucide-react).
function IconPenSquare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
function IconMessageSquare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export default function Navbar() {
  const { user, accessToken, isLoading, logout } = useAuth()
  const { toggleMobile } = useSidebar()
  const { openLogin, openRegister } = useAuthModal()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Polling de solicitudes de amistad pendientes cada 15s
  useEffect(() => {
    if (!accessToken) return
    const check = () => {
      fetch('/api/friends/pending', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then((d: { count: number } | null) => { if (d) setPendingFriends(d.count) })
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [accessToken])

  // Polling de mensajes no leídos cada 15s (endpoint /api/messages/unread ya existe).
  useEffect(() => {
    if (!accessToken) return
    const check = () => {
      fetch('/api/messages/unread', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then((d: { count: number } | null) => { if (d) setUnreadMessages(d.count) })
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [accessToken])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  async function handleLogout() {
    await logout()
    setDropdownOpen(false)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      {/* Layout 3 zonas: izquierda (logo+hamburguesa) | centro (search) | derecha (actions) */}
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
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              <div className="w-20 h-4 rounded bg-gray-700 animate-pulse" />
            </div>
          ) : user ? (
            <>
              {/* Iconos de acción rápida */}
              <Link
                href="/submit"
                aria-label="Crear post"
                title="Crear post"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
              >
                <IconPenSquare />
              </Link>

              <Link
                href="/messages"
                aria-label="Mensajes"
                title="Mensajes"
                className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
              >
                <IconMessageSquare />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              <Link
                href="/friends"
                aria-label="Amigos"
                title="Amigos"
                className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
              >
                <IconUsers />
                {pendingFriends > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {pendingFriends > 9 ? '9+' : pendingFriends}
                  </span>
                )}
              </Link>

              {/* Dropdown del avatar (reducido) */}
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm text-gray-200">{user.username}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href={`/user/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      Configuración
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-indigo-400 hover:bg-gray-700"
                      >
                        Panel de administración
                      </Link>
                    )}
                    <hr className="border-gray-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
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
