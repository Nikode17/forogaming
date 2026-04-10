'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface UserResult {
  id: string
  username: string
  avatar_url: string | null
  role: string
}

interface Props {
  onClose: () => void
}

type RequestStatus = 'idle' | 'sending' | 'sent' | 'already_friends' | 'error'

export default function AddFriendModal({ onClose }: Props) {
  const { accessToken } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      if (res.ok) {
        const data = await res.json() as { data: UserResult[] }
        setResults(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  async function sendRequest(username: string) {
    setStatuses(s => ({ ...s, [username]: 'sending' }))
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username }),
      })
      const data = await res.json() as { status?: string; error?: { code: string } }
      if (res.ok) {
        setStatuses(s => ({ ...s, [username]: data.status === 'accepted' ? 'already_friends' : 'sent' }))
      } else if (data.error?.code === 'CONFLICT') {
        setStatuses(s => ({ ...s, [username]: 'already_friends' }))
      } else {
        setStatuses(s => ({ ...s, [username]: 'error' }))
      }
    } catch {
      setStatuses(s => ({ ...s, [username]: 'error' }))
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'text-red-400',
    moderator: 'text-yellow-400',
    user: 'text-gray-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-gray-100">Agregar amigo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="Busca por nombre de usuario..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading && (
            <p className="text-sm text-gray-500 text-center py-8">No se encontraron usuarios.</p>
          )}
          {query.length < 2 && (
            <p className="text-sm text-gray-600 text-center py-8">Escribe al menos 2 caracteres.</p>
          )}
          {results.map((u) => {
            const status = statuses[u.username] ?? 'idle'
            return (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors">
                <Link href={`/user/${u.username}`} onClick={onClose} className="shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/user/${u.username}`} onClick={onClose}
                    className="text-sm font-medium text-gray-100 hover:text-white truncate block">
                    {u.username}
                  </Link>
                  <span className={`text-xs capitalize ${roleColors[u.role] ?? 'text-gray-500'}`}>{u.role}</span>
                </div>
                <button
                  onClick={() => sendRequest(u.username)}
                  disabled={status !== 'idle'}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:cursor-not-allowed ${
                    status === 'idle'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : status === 'sending'
                      ? 'bg-gray-700 text-gray-400'
                      : status === 'sent'
                      ? 'bg-green-900/50 text-green-400 border border-green-800'
                      : status === 'already_friends'
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}
                >
                  {status === 'idle' && 'Agregar'}
                  {status === 'sending' && '...'}
                  {status === 'sent' && '✓ Enviada'}
                  {status === 'already_friends' && 'Ya amigos'}
                  {status === 'error' && 'Error'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
