'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AddFriendModal from '@/components/AddFriendModal'

interface Friend {
  id: string
  username: string
  avatar_url: string | null
}

interface PendingRequest {
  id: string
  sender_id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export default function FriendsPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  const loadFriends = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/friends', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (res.ok) {
        const data = await res.json() as { friends: Friend[]; pending: PendingRequest[] }
        setFriends(data.friends)
        setPending(data.pending)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoading || !accessToken) return
    loadFriends()
  }, [accessToken, isLoading])

  async function respond(requestId: string, action: 'accept' | 'reject') {
    await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ request_id: requestId, action }),
    })
    loadFriends()
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {showModal && <AddFriendModal onClose={() => { setShowModal(false); loadFriends() }} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Amigos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Agregar amigo
        </button>
      </div>

      {/* Solicitudes pendientes */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Solicitudes pendientes ({pending.length})
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/user/${req.username}`}>
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt={req.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                      {req.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/user/${req.username}`} className="text-sm font-medium text-gray-100 hover:text-white">
                    {req.username}
                  </Link>
                  <p className="text-xs text-gray-500">quiere ser tu amigo</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(req.id, 'accept')}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => respond(req.id, 'reject')}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de amigos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Tus amigos ({friends.length})
        </h2>

        {friends.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
            <p className="text-gray-400 mb-1">Todavía no tienes amigos.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Agregar tu primer amigo →
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/user/${f.username}`}>
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt={f.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                      {f.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <Link href={`/user/${f.username}`} className="text-sm font-medium text-gray-100 hover:text-white">
                    {f.username}
                  </Link>
                </div>
                <Link
                  href={`/messages/${f.username}`}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Mensaje
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
