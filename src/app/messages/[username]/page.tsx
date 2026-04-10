'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ChatPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams<{ username: string }>()
  const otherUsername = params.username

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCreatedAt = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  // Carga inicial
  const loadMessages = useCallback(async (since?: string) => {
    if (!accessToken) return
    const url = since
      ? `/api/messages/${otherUsername}?since=${encodeURIComponent(since)}`
      : `/api/messages/${otherUsername}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) return
    const data = await res.json() as { data: Message[] }
    if (data.data.length > 0) {
      if (since) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMsgs = data.data.filter(m => !existingIds.has(m.id))
          return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
        })
      } else {
        setMessages(data.data)
      }
      lastCreatedAt.current = data.data[data.data.length - 1].created_at
    }
    setLoadingMsgs(false)
  }, [accessToken, otherUsername])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Scroll al fondo cuando llegan mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling cada 3 segundos para mensajes nuevos
  useEffect(() => {
    if (!accessToken) return
    const interval = setInterval(() => {
      if (lastCreatedAt.current) loadMessages(lastCreatedAt.current)
    }, 3000)
    return () => clearInterval(interval)
  }, [accessToken, loadMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/messages/${otherUsername}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: text }),
      })
      if (res.ok) {
        // Recargar mensajes inmediatamente tras enviar
        await loadMessages(lastCreatedAt.current ?? undefined)
      }
    } finally {
      setSending(false)
    }
  }

  if (isLoading) return null
  if (!user) return null

  // Agrupar mensajes por fecha
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.created_at)
    if (!grouped.length || grouped[grouped.length - 1].date !== date) {
      grouped.push({ date, msgs: [msg] })
    } else {
      grouped[grouped.length - 1].msgs.push(msg)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800 mb-4">
        <Link href="/messages" className="text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href={`/user/${otherUsername}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
            {otherUsername.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-100">{otherUsername}</span>
        </Link>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {loadingMsgs ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm pt-10">
            Sé el primero en enviar un mensaje a @{otherUsername}.
          </p>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">{group.date}</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              {group.msgs.map((msg) => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                    }`}>
                      <p className="break-words">{msg.body}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-indigo-300' : 'text-gray-500'} text-right`}>
                        {formatTime(msg.created_at)}
                        {isMe && msg.read_at && <span className="ml-1">✓</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-gray-800 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Mensaje a @${otherUsername}...`}
          maxLength={2000}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
