'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Conversation {
  other_id: string
  other_username: string
  other_avatar: string | null
  last_body: string
  last_at: string
  unread: number
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function MessagesPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/messages', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then((d: { data: Conversation[] } | null) => { if (d) setConvs(d.data) })
      .finally(() => setLoading(false))
  }, [accessToken])

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
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Mensajes</h1>

      {convs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
          <p className="text-gray-400 mb-1">No tienes conversaciones todavía.</p>
          <p className="text-sm text-gray-600">
            Ve al perfil de un usuario y haz clic en &ldquo;Mensaje&rdquo; para empezar.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800">
          {convs.map((c) => (
            <Link
              key={c.other_id}
              href={`/messages/${c.other_username}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors"
            >
              {c.other_avatar ? (
                <img src={c.other_avatar} alt={c.other_username}
                  className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {c.other_username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${c.unread > 0 ? 'text-white' : 'text-gray-200'}`}>
                    {c.other_username}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{timeAgo(c.last_at)}</span>
                </div>
                <p className={`text-sm truncate ${c.unread > 0 ? 'text-gray-200' : 'text-gray-500'}`}>
                  {c.last_body}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {c.unread > 9 ? '9+' : c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
