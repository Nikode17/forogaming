'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Conversation {
  other_id: string
  other_username: string
  other_avatar: string | null
  last_body: string
  last_at: string
  unread: number
}

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

type View = 'closed' | 'convs' | 'chat'

export default function ChatWidget() {
  const { user, accessToken } = useAuth()
  const [view, setView] = useState<View>('closed')
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [fetchedConvs, setFetchedConvs] = useState(false)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastCreatedAt = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Poll unread count
  useEffect(() => {
    if (!accessToken) return
    const check = () => {
      fetch('/api/messages/unread', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then((d: { count: number } | null) => { if (d) setUnreadCount(d.count) })
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [accessToken])

  // Load conversations when panel opens
  useEffect(() => {
    if (view !== 'convs' || !accessToken || fetchedConvs) return
    setLoadingConvs(true)
    fetch('/api/messages', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then((d: { data: Conversation[] } | null) => { if (d) setConvs(d.data) })
      .finally(() => { setLoadingConvs(false); setFetchedConvs(true) })
  }, [view, accessToken, fetchedConvs])

  // Load messages when active chat changes
  const loadMessages = useCallback(async (since?: string) => {
    if (!accessToken || !activeChat) return
    const url = since
      ? `/api/messages/${activeChat}?since=${encodeURIComponent(since)}`
      : `/api/messages/${activeChat}`
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
  }, [accessToken, activeChat])

  useEffect(() => {
    if (view !== 'chat' || !activeChat) return
    setLoadingMsgs(true)
    lastCreatedAt.current = null
    setMessages([])
    loadMessages()
  }, [view, activeChat, loadMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling for new messages in chat view
  useEffect(() => {
    if (view !== 'chat' || !accessToken) return
    const interval = setInterval(() => {
      if (lastCreatedAt.current) {
        const since = new Date(new Date(lastCreatedAt.current).getTime() + 1).toISOString()
        loadMessages(since)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [view, accessToken, loadMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !activeChat) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/messages/${activeChat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: text }),
      })
      if (res.ok) {
        await loadMessages(lastCreatedAt.current ?? undefined)
      }
    } finally {
      setSending(false)
    }
  }

  function openChat(username: string) {
    setActiveChat(username)
    setView('chat')
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  function openConvs() {
    setFetchedConvs(false)
    setView('convs')
  }

  if (!user) return null

  const isOpen = view !== 'closed'

  // Group messages by date
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
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setView('closed')}
        />
      )}

      <div className={`fixed z-50 transition-all duration-200 ease-out
        ${isOpen
          ? 'inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px]'
          : 'bottom-4 right-4'
        }
      `}>
        {/* Chat panel */}
        {isOpen && (
          <div
            className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: 'min(520px, 80dvh)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700 shrink-0 backdrop-blur">
              {view === 'chat' ? (
                <button
                  onClick={openConvs}
                  className="text-gray-400 hover:text-gray-200 transition-colors mr-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : null}

              <span className="font-semibold text-gray-100 flex-1 text-sm truncate">
                {view === 'convs' ? 'Mensajes' : `@${activeChat}`}
              </span>

              {view === 'chat' && activeChat && (
                <Link
                  href={`/messages/${activeChat}`}
                  onClick={() => setView('closed')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 mr-2"
                >
                  Ver completo
                </Link>
              )}

              <button
                onClick={() => setView('closed')}
                className="text-gray-400 hover:text-gray-200 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conversations list */}
            {view === 'convs' && (
              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : convs.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-gray-500 text-sm">No tienes conversaciones todavía.</p>
                    <p className="text-xs text-gray-600 mt-1">Ve al perfil de alguien y haz clic en &ldquo;Mensaje&rdquo;.</p>
                  </div>
                ) : (
                  convs.map(c => (
                    <button
                      key={c.other_id}
                      onClick={() => openChat(c.other_username)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800/60 last:border-0"
                    >
                      {c.other_avatar ? (
                        <img
                          src={c.other_avatar}
                          alt={c.other_username}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                          {c.other_username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold truncate ${c.unread > 0 ? 'text-white' : 'text-gray-200'}`}>
                            {c.other_username}
                          </span>
                          <span className="text-xs text-gray-500 shrink-0">{timeAgo(c.last_at)}</span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                          {c.last_body}
                        </p>
                      </div>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {c.unread > 9 ? '9+' : c.unread}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Active chat */}
            {view === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  {loadingMsgs ? (
                    <div className="flex justify-center pt-10">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs pt-10">
                      Sé el primero en enviar un mensaje.
                    </p>
                  ) : (
                    grouped.map(group => (
                      <div key={group.date}>
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-gray-800" />
                          <span className="text-xs text-gray-600">{group.date}</span>
                          <div className="flex-1 h-px bg-gray-800" />
                        </div>
                        {group.msgs.map(msg => {
                          const isMe = msg.sender_id === user.id
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-br-sm'
                                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                              }`}>
                                <p className="break-words leading-relaxed">{msg.body}</p>
                                <p className={`text-[10px] mt-0.5 ${isMe ? 'text-indigo-300' : 'text-gray-500'} text-right`}>
                                  {formatTime(msg.created_at)}
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

                <form onSubmit={sendMessage} className="flex gap-2 px-3 py-3 border-t border-gray-800 shrink-0">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={2000}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Floating button */}
        {!isOpen && (
          <button
            onClick={openConvs}
            className="relative w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-xl flex items-center justify-center transition-colors ml-auto"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  )
}
