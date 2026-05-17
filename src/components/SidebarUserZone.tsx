'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// ─── SVG inline (mismo patrón que el resto del proyecto: no usamos lucide-react) ───
function IconPenSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
function IconMessageSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconUsersGroup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconLogOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconChevronDown({ rotated = false }: { rotated?: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${rotated ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const MORE_OPEN_KEY = 'respawn.sidebar.user-more-open'

interface SidebarUserZoneProps {
  /** Estado de colapso de la sidebar (desktop). En mobile siempre es expandido. */
  isCollapsed: boolean
  /** Callback opcional para cerrar el overlay mobile al navegar. */
  onNavigate?: () => void
}

export default function SidebarUserZone({ isCollapsed, onNavigate }: SidebarUserZoneProps) {
  const { user, accessToken, logout } = useAuth()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Hidratación de moreOpen desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(MORE_OPEN_KEY)
    if (stored === '1') setMoreOpen(true)
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(MORE_OPEN_KEY, moreOpen ? '1' : '0')
  }, [moreOpen, hydrated])

  // Polling /api/friends/pending cada 15s
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

  // Polling /api/messages/unread cada 15s
  useEffect(() => {
    if (!accessToken) return
    const check = () => {
      fetch('/api/messages/unread', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then((d: { count: number } | null) => { if (d) setUnreadMessages(d.count) })
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [accessToken])

  const handleLogout = useCallback(async () => {
    await logout()
    onNavigate?.()
    router.push('/')
  }, [logout, onNavigate, router])

  if (!user) return null

  // ─── Modo colapsado: avatar + 3 iconos centrados ───
  if (isCollapsed) {
    return (
      <div className="p-2 border-b border-gray-800 shrink-0 flex flex-col items-center gap-1">
        <Link
          href={`/user/${user.username}`}
          title={user.username}
          aria-label={`Perfil de ${user.username}`}
          className="block"
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <Link
          href="/submit"
          title="Crear post"
          aria-label="Crear post"
          className="w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
        >
          <IconPenSquare />
        </Link>

        <Link
          href="/messages"
          title="Mensajes"
          aria-label="Mensajes"
          className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
        >
          <IconMessageSquare />
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        <Link
          href="/friends"
          title="Amigos"
          aria-label="Amigos"
          className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
        >
          <IconUsersGroup />
          {pendingFriends > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
              {pendingFriends > 9 ? '9+' : pendingFriends}
            </span>
          )}
        </Link>
      </div>
    )
  }

  // ─── Modo expandido: cabecera con avatar + items con label ───
  const baseItemClass = 'flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-colors'
  return (
    <div className="p-3 border-b border-gray-800 shrink-0 space-y-1">
      {/* Cabecera: avatar + username */}
      <Link
        href={`/user/${user.username}`}
        onClick={onNavigate}
        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-100 truncate">{user.username}</span>
      </Link>

      <div className="border-t border-gray-800 my-1" />

      {/* Acciones primarias */}
      <Link href="/submit" onClick={onNavigate} className={`${baseItemClass} text-gray-300 hover:text-white hover:bg-gray-800`}>
        <IconPenSquare />
        <span className="flex-1">Crear post</span>
      </Link>

      <Link href="/messages" onClick={onNavigate} className={`${baseItemClass} text-gray-300 hover:text-white hover:bg-gray-800`}>
        <IconMessageSquare />
        <span className="flex-1">Mensajes</span>
        {unreadMessages > 0 && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </Link>

      <Link href="/friends" onClick={onNavigate} className={`${baseItemClass} text-gray-300 hover:text-white hover:bg-gray-800`}>
        <IconUsersGroup />
        <span className="flex-1">Amigos</span>
        {pendingFriends > 0 && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {pendingFriends > 9 ? '9+' : pendingFriends}
          </span>
        )}
      </Link>

      <div className="border-t border-gray-800 my-1" />

      {/* Toggle "Más opciones" */}
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
        className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <IconChevronDown rotated={moreOpen} />
        <span className="flex-1 text-left">Más opciones</span>
      </button>

      {moreOpen && (
        <div className="space-y-1 pl-2">
          <Link href={`/user/${user.username}`} onClick={onNavigate} className={`${baseItemClass} text-gray-300 hover:text-white hover:bg-gray-800`}>
            <IconUser />
            <span className="flex-1">Mi perfil</span>
          </Link>

          <Link href="/settings" onClick={onNavigate} className={`${baseItemClass} text-gray-300 hover:text-white hover:bg-gray-800`}>
            <IconSettings />
            <span className="flex-1">Configuración</span>
          </Link>

          {user.role === 'admin' && (
            <Link href="/admin" onClick={onNavigate} className={`${baseItemClass} text-indigo-400 hover:text-indigo-300 hover:bg-gray-800`}>
              <IconShield />
              <span className="flex-1">Panel admin</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`${baseItemClass} w-full text-red-400 hover:text-red-300 hover:bg-gray-800`}
          >
            <IconLogOut />
            <span className="flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
