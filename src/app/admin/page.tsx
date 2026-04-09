'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || !['admin', 'moderator'].includes(user.role))) {
      router.push('/')
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (!accessToken) return
    async function fetchPendingCount() {
      try {
        const res = await fetch('/api/admin/reports?status=pending&limit=1', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = (await res.json()) as { pagination?: { total: number } }
          setPendingCount(data.pagination?.total ?? 0)
        }
      } catch {
        // silenciar error
      }
    }
    fetchPendingCount()
  }, [accessToken])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Panel de Moderacion</h1>
      <p className="text-sm text-gray-400 mb-8">
        Gestiona reportes y usuarios de la comunidad.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reportes pendientes */}
        <Link
          href="/admin/reports"
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-600 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">&#128680;</span>
            {pendingCount !== null && pendingCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors mb-1">
            Reportes pendientes
          </h2>
          <p className="text-sm text-gray-500">
            Revisa y gestiona los reportes de la comunidad.
          </p>
        </Link>

        {/* Gestion de usuarios */}
        <Link
          href="/admin/users"
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-600 transition-colors group"
        >
          <div className="mb-3">
            <span className="text-3xl">&#128101;</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors mb-1">
            Gestion de usuarios
          </h2>
          <p className="text-sm text-gray-500">
            Busca usuarios, gestiona roles y bans.
          </p>
        </Link>

        {/* Catálogo de juegos — solo admin */}
        {user.role === 'admin' && (
          <Link
            href="/admin/games"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-indigo-600 transition-colors group"
          >
            <div className="mb-3">
              <span className="text-3xl">🎮</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors mb-1">
              Catálogo de juegos
            </h2>
            <p className="text-sm text-gray-500">
              Crea y edita los juegos del foro.
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}
