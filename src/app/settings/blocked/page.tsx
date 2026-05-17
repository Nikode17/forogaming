'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import BlockButton from '@/components/BlockButton'

interface BlockedUser {
  block_id: string
  blocked_at: string
  user: { id: string; username: string; avatar_url: string | null }
}

interface BlocksResponse {
  data: BlockedUser[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function BlockedUsersPage() {
  const { accessToken, isLoading } = useAuth()
  const [blocks, setBlocks] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlocks = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/me/blocks?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        setError('No se pudo cargar la lista')
        return
      }
      const data = (await res.json()) as BlocksResponse
      setBlocks(data.data)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!isLoading && accessToken) void fetchBlocks()
  }, [isLoading, accessToken, fetchBlocks])

  if (isLoading) return null
  if (!accessToken) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400">
        Necesitas iniciar sesión para ver tu lista de bloqueados.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Usuarios bloqueados</h1>
      <p className="text-sm text-gray-500 mb-6">
        Estos usuarios no verán nada tuyo ni tú nada de ellos en ningún feed,
        perfil, mensaje o comentario.
      </p>

      {error && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : blocks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No has bloqueado a nadie.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.block_id}
              className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
            >
              <Link href={`/user/${b.user.username}`} className="flex items-center gap-3 min-w-0">
                {b.user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold text-white">
                    {b.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-200 truncate">@{b.user.username}</p>
                  <p className="text-xs text-gray-500">
                    Bloqueado el {new Date(b.blocked_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </Link>

              <BlockButton
                targetUsername={b.user.username}
                initialBlocked
                variant="compact"
                onChange={(nowBlocked) => {
                  if (!nowBlocked) {
                    setBlocks((prev) => prev.filter((x) => x.block_id !== b.block_id))
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
