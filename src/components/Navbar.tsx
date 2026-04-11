'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, accessToken, isLoading, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pendingFriends, setPendingFriends] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Polling de solicitudes de amistad pendientes cada 15 segundos
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
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  async function handleLogout() {
    await logout()
    setDropdownOpen(false)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity">
          <img src="/logo.png" alt="Respawn" className="h-10 w-auto" />
        </Link>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {/* Icono lupa */}
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

        {/* Sección derecha */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoading ? (
            /* Skeleton placeholder */
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              <div className="w-20 h-4 rounded bg-gray-700 animate-pulse" />
            </div>
          ) : user ? (
            /* Usuario autenticado */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-200">{user.username}</span>
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
                    href="/messages"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Mensajes
                  </Link>
                  <Link
                    href="/friends"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Amigos
                    {pendingFriends > 0 && (
                      <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingFriends > 9 ? '9+' : pendingFriends}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/submit"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Crear post
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Configuración
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <hr className="border-gray-700 my-1" />
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-indigo-400 hover:bg-gray-700"
                      >
                        Panel de administración
                      </Link>
                    </>
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
          ) : (
            /* No autenticado */
            <>
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
