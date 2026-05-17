'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ReportModal, { type ReportTargetType } from '@/components/ReportModal'

interface UserActionsMenuProps {
  targetUsername: string
  targetUserId: string
  /** Si se pasa, el menú incluye opción "Reportar post" además de "Reportar @user". */
  reportablePostId?: string
  /** Si se pasa, el menú incluye opción "Reportar comentario" además de "Reportar @user". */
  reportableCommentId?: string
}

export default function UserActionsMenu({
  targetUsername,
  targetUserId,
  reportablePostId,
  reportableCommentId,
}: UserActionsMenuProps) {
  const { accessToken, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null)  // null = unknown
  const [confirmingBlock, setConfirmingBlock] = useState(false)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType
    id: string
    label: string
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const isSelf = user?.username === targetUsername || user?.id === targetUserId

  // Autodetectar si lo tengo bloqueado, una sola vez al abrir y solo si no
  // es uno mismo y hay sesión.
  useEffect(() => {
    if (!open || !accessToken || isSelf || isBlocked !== null) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/users/me/blocks?limit=100', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { data?: Array<{ user: { id: string; username: string } }> }
        if (cancelled) return
        const found = data.data?.some(
          (b) => b.user.id === targetUserId || b.user.username === targetUsername
        ) ?? false
        setIsBlocked(found)
      } catch {
        // si falla, dejamos null — la opción de bloquear seguirá disponible
      }
    })()
    return () => { cancelled = true }
  }, [open, accessToken, isSelf, isBlocked, targetUserId, targetUsername])

  // Click outside + Escape cierran el menú
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false)
        setConfirmingBlock(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirmingBlock(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Decidir si el menú abre hacia abajo o arriba según el espacio disponible
  const toggle = useCallback(() => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUpward(spaceBelow < 220)
    }
    setOpen(true)
  }, [open])

  // Si no hay sesión, no renderizamos nada (no tiene sentido el menú para guests)
  if (!user) return null

  const doBlock = async () => {
    if (!accessToken) return
    setPending(true)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetUsername)}/block`, {
        method: isBlocked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        setIsBlocked(!isBlocked)
        setOpen(false)
        setConfirmingBlock(false)
      }
    } finally {
      setPending(false)
    }
  }

  const doCopyLink = async () => {
    const url = `${window.location.origin}/user/${targetUsername}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => { setCopied(false); setOpen(false) }, 900)
    } catch {
      setOpen(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Más opciones"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-6 h-6 inline-flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="5"  r="1.2" />
          <circle cx="12" cy="12" r="1.2" />
          <circle cx="12" cy="19" r="1.2" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute right-0 z-50 min-w-[200px] bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {!isSelf && (
            <>
              {confirmingBlock ? (
                <div className="px-3 py-2 border-b border-gray-800">
                  <p className="text-xs text-gray-300 mb-2">
                    ¿Bloquear a @{targetUsername}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={doBlock}
                      disabled={pending}
                      className="flex-1 px-2 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                    >
                      {pending ? '…' : 'Sí, bloquear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingBlock(false)}
                      disabled={pending}
                      className="flex-1 px-2 py-1 text-xs font-medium rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : isBlocked ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={doBlock}
                  disabled={pending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Desbloquear @{targetUsername}
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirmingBlock(true)}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                >
                  Bloquear @{targetUsername}
                </button>
              )}

              {reportablePostId && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setReportTarget({ type: 'post', id: reportablePostId, label: 'este post' })
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Reportar post
                </button>
              )}

              {reportableCommentId && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setReportTarget({ type: 'comment', id: reportableCommentId, label: `el comentario de @${targetUsername}` })
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Reportar comentario
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setReportTarget({ type: 'user', id: targetUserId, label: `a @${targetUsername}` })
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Reportar usuario
              </button>
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={doCopyLink}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {copied ? '✓ Enlace copiado' : 'Copiar enlace al perfil'}
          </button>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
        />
      )}
    </div>
  )
}
