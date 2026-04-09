'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserResult {
  id: string
  username: string
  role: 'admin' | 'moderator' | 'user' | 'guest'
  avatar_url: string | null
  is_banned: boolean
  created_at: string
}

const roleBadges: Record<string, { bg: string; label: string }> = {
  admin: { bg: 'bg-red-900 text-red-300', label: 'Admin' },
  moderator: { bg: 'bg-yellow-900 text-yellow-300', label: 'Moderador' },
  user: { bg: 'bg-gray-700 text-gray-300', label: 'Usuario' },
  guest: { bg: 'bg-gray-800 text-gray-500', label: 'Invitado' },
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function AdminUsersPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<UserResult | null>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [banLoading, setBanLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || !['admin', 'moderator'].includes(user.role))) {
      router.push('/')
    }
  }, [isLoading, user, router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed || !accessToken) return

    setSearching(true)
    setSearchError('')
    setSearchResult(null)

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { user: UserResult }
        setSearchResult(data.user)
      } else if (res.status === 404) {
        setSearchError(`No se encontro el usuario "${trimmed}".`)
      } else {
        setSearchError('Error al buscar usuario.')
      }
    } catch {
      setSearchError('Error de conexion.')
    } finally {
      setSearching(false)
    }
  }

  const handleBanToggle = async () => {
    if (!searchResult || !accessToken) return

    const action = searchResult.is_banned ? 'desbanear' : 'banear'
    const confirmed = window.confirm(
      `Estas seguro de que quieres ${action} a @${searchResult.username}?`
    )
    if (!confirmed) return

    setBanLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${searchResult.id}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_banned: !searchResult.is_banned }),
      })
      if (res.ok) {
        setSearchResult((prev) =>
          prev ? { ...prev, is_banned: !prev.is_banned } : null
        )
      }
    } catch {
      // silenciar error
    } finally {
      setBanLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) return null

  const role = searchResult ? (roleBadges[searchResult.role] ?? roleBadges.user) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-indigo-400 transition-colors"
        >
          &larr; Panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Gestion de usuarios</h1>
      </div>

      {/* Busqueda */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por username..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Error */}
      {searchError && (
        <div className="bg-red-900/50 border border-red-800 rounded-lg px-4 py-3 mb-6 text-sm text-red-300">
          {searchError}
        </div>
      )}

      {/* Resultado */}
      {searchResult && role && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {searchResult.is_banned && (
            <div className="bg-red-900/50 border border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-300 font-medium">
              Este usuario esta baneado.
            </div>
          )}

          <div className="flex items-start gap-4">
            {/* Avatar */}
            {searchResult.avatar_url ? (
              <img
                src={searchResult.avatar_url}
                alt={searchResult.username}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                {searchResult.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <Link
                  href={`/user/${searchResult.username}`}
                  className="text-lg font-bold text-gray-100 hover:text-indigo-400 transition-colors"
                >
                  {searchResult.username}
                </Link>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${role.bg}`}>
                  {role.label}
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                  searchResult.is_banned
                    ? 'bg-red-900 text-red-300'
                    : 'bg-green-900 text-green-300'
                }`}>
                  {searchResult.is_banned ? 'Baneado' : 'Activo'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Miembro desde {formatDate(searchResult.created_at)}
              </p>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={handleBanToggle}
                  disabled={banLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    searchResult.is_banned
                      ? 'bg-green-900/50 text-green-300 hover:bg-green-900'
                      : 'bg-red-900/50 text-red-300 hover:bg-red-900'
                  }`}
                >
                  {banLoading
                    ? 'Procesando...'
                    : searchResult.is_banned
                      ? 'Desbanear usuario'
                      : 'Banear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota */}
      {!searchResult && !searchError && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-900 border border-gray-800 rounded-lg">
          <div className="text-3xl mb-3">&#128269;</div>
          <p className="text-gray-400">Busca un usuario por su nombre de usuario para gestionar su cuenta.</p>
        </div>
      )}
    </div>
  )
}
