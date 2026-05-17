'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

interface Props {
  username: string
  initialFollowing: boolean
  initialCount: number
}

export default function FollowButton({ username, initialFollowing, initialCount }: Props) {
  const { user, accessToken } = useAuth()
  const { openLogin } = useAuthModal()
  const [following, setFollowing] = useState<boolean | null>(null) // null = cargando estado real
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // Siempre verificar estado real desde el cliente (server component no tiene JWT)
  useEffect(() => {
    if (!accessToken || !user) {
      setFollowing(initialFollowing)
      return
    }
    fetch(`/api/users/${username}/follow`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: { following: boolean } | null) => setFollowing(d?.following ?? initialFollowing))
      .catch(() => setFollowing(initialFollowing))
  }, [accessToken, username, user, initialFollowing])

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLogin}
        className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
      >
        Seguir
      </button>
    )
  }

  if (user.username === username) return null

  async function toggle() {
    setLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${username}/follow`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        setFollowing(!following)
        setCount((c) => c + (following ? -1 : 1))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || following === null}
      className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
        following
          ? 'bg-gray-700 hover:bg-red-900/50 hover:text-red-300 text-gray-200 border border-gray-600'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
      }`}
    >
      {following === null || loading ? '...' : following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
