'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface BlockButtonProps {
  /** Username del usuario objetivo (NO el viewer). */
  targetUsername: string
  /**
   * Estado inicial conocido. Si se omite, el componente lo descubre por sí
   * mismo consultando /api/users/me/blocks al montar (modo auto-detect).
   */
  initialBlocked?: boolean
  /** Variante visual. `prominent` para perfiles, `compact` para menús/listas. */
  variant?: 'prominent' | 'compact'
  /** Callback opcional tras una acción exitosa. */
  onChange?: (nowBlocked: boolean) => void
}

export default function BlockButton({
  targetUsername,
  initialBlocked,
  variant = 'prominent',
  onChange,
}: BlockButtonProps) {
  const router = useRouter()
  const { accessToken, user } = useAuth()
  const [isBlocked, setIsBlocked] = useState<boolean>(initialBlocked ?? false)
  const [autoDetecting, setAutoDetecting] = useState(initialBlocked === undefined)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect: server components no pueden conocer al viewer (no propagamos
  // JWT al fetch interno). Si el padre no nos pasa initialBlocked, lo
  // descubrimos consultando nuestros propios bloqueos al montar.
  useEffect(() => {
    if (initialBlocked !== undefined || !accessToken) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/users/me/blocks?limit=50', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { data?: Array<{ user: { username: string } }> }
        if (cancelled) return
        const found = data.data?.some((b) => b.user.username === targetUsername) ?? false
        setIsBlocked(found)
      } finally {
        if (!cancelled) setAutoDetecting(false)
      }
    })()
    return () => { cancelled = true }
  }, [accessToken, initialBlocked, targetUsername])

  // No mostrar el botón si no hay sesión o si es el propio user
  if (!user || user.username === targetUsername) return null

  const doAction = async (action: 'block' | 'unblock') => {
    if (!accessToken) {
      setError('Necesitas iniciar sesión')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetUsername)}/block`, {
        method: action === 'block' ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
        setError(data?.error?.message ?? 'Error al procesar la acción')
        return
      }
      const nowBlocked = action === 'block'
      setIsBlocked(nowBlocked)
      setConfirming(false)
      onChange?.(nowBlocked)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setPending(false)
    }
  }

  if (autoDetecting) {
    return (
      <span className="text-sm text-gray-500">…</span>
    )
  }

  // ── Caso desbloquear: un solo click, sin diálogo ──
  if (isBlocked) {
    return (
      <div className="inline-flex flex-col gap-1">
        <button
          type="button"
          onClick={() => doAction('unblock')}
          disabled={pending}
          className={
            variant === 'prominent'
              ? 'px-4 py-2 text-sm font-medium rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50 transition-colors'
              : 'text-sm text-gray-300 hover:text-white disabled:opacity-50'
          }
        >
          {pending ? 'Desbloqueando…' : 'Desbloquear'}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  // ── Caso bloquear: requiere confirmación inline ──
  if (confirming) {
    return (
      <div className="inline-flex flex-col gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900/50 max-w-xs">
        <p className="text-sm text-red-200">
          ¿Bloquear a <span className="font-semibold">@{targetUsername}</span>? No volveréis a veros en posts, comentarios ni mensajes.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => doAction('block')}
            disabled={pending}
            className="px-3 py-1.5 text-sm font-medium rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
          >
            {pending ? 'Bloqueando…' : 'Sí, bloquear'}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={pending}
            className="px-3 py-1.5 text-sm font-medium rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={
        variant === 'prominent'
          ? 'px-4 py-2 text-sm font-medium rounded-lg border border-red-800 text-red-300 hover:bg-red-950/30 transition-colors'
          : 'text-sm text-red-400 hover:text-red-300'
      }
    >
      Bloquear
    </button>
  )
}
