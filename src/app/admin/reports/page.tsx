'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type StatusFilter = 'pending' | 'resolved' | 'dismissed' | 'all'
type TypeFilter = 'all' | 'post' | 'comment' | 'user' | 'message'
type ResolveAction = 'dismiss' | 'remove_content' | 'ban_user'

type TargetDetails =
  | { kind: 'post'; title: string; body_snippet: string }
  | { kind: 'comment'; body_snippet: string; post_id: string; post_title: string }
  | { kind: 'user'; username: string; avatar_url: string | null }
  | { kind: 'message'; body_snippet: string; sender_username: string | null; recipient_username: string | null }
  | { kind: 'missing'; reason: string }

interface Report {
  id: string
  target_type: 'post' | 'comment' | 'user' | 'message'
  target_id: string
  reason: string | null
  description: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at: string | null
  reporter: { username: string } | null
  resolver: { username: string } | null
  target_details: TargetDetails
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Acoso',
  hate_speech: 'Discurso de odio',
  inappropriate_content: 'Contenido inapropiado',
  misinformation: 'Desinformación',
  other: 'Otro',
}

const TYPE_BADGES: Record<Report['target_type'], { bg: string; label: string }> = {
  post:    { bg: 'bg-blue-900/60 text-blue-300 border border-blue-800',     label: 'Post' },
  comment: { bg: 'bg-purple-900/60 text-purple-300 border border-purple-800', label: 'Comentario' },
  user:    { bg: 'bg-red-900/60 text-red-300 border border-red-800',         label: 'Usuario' },
  message: { bg: 'bg-yellow-900/60 text-yellow-300 border border-yellow-800', label: 'Mensaje' },
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending',    label: 'Pendientes' },
  { value: 'resolved',   label: 'Resueltos' },
  { value: 'dismissed',  label: 'Desestimados' },
  { value: 'all',        label: 'Todos' },
]

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'all',     label: 'Todos los tipos' },
  { value: 'post',    label: 'Posts' },
  { value: 'comment', label: 'Comentarios' },
  { value: 'user',    label: 'Usuarios' },
  { value: 'message', label: 'Mensajes' },
]

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} días`
}

function TargetDetailsView({ d }: { d: TargetDetails }) {
  switch (d.kind) {
    case 'post':
      return (
        <div>
          <p className="text-sm font-semibold text-gray-200 mb-0.5">{d.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{d.body_snippet}</p>
        </div>
      )
    case 'comment':
      return (
        <div>
          <p className="text-xs text-gray-500 mb-0.5">en post «{d.post_title}»</p>
          <p className="text-sm text-gray-300 line-clamp-2">{d.body_snippet}</p>
        </div>
      )
    case 'user':
      return (
        <div className="flex items-center gap-2">
          {d.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
              {d.username.charAt(0).toUpperCase()}
            </div>
          )}
          <Link href={`/user/${d.username}`} className="text-sm text-gray-200 hover:text-indigo-400">
            @{d.username}
          </Link>
        </div>
      )
    case 'message':
      return (
        <div>
          <p className="text-xs text-gray-500 mb-0.5">
            de @{d.sender_username ?? '?'} → @{d.recipient_username ?? '?'}
          </p>
          <p className="text-sm text-gray-300 line-clamp-2">{d.body_snippet}</p>
        </div>
      )
    case 'missing':
      return <p className="text-xs text-gray-600 italic">{d.reason}</p>
  }
}

export default function AdminReportsPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{ reportId: string; action: ResolveAction } | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || !['admin', 'moderator'].includes(user.role))) {
      router.push('/')
    }
  }, [isLoading, user, router])

  const fetchReports = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const url = `/api/admin/reports?status=${statusFilter}&targetType=${typeFilter}&limit=20`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (res.ok) {
        const data = (await res.json()) as { data: Report[] }
        setReports(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken, statusFilter, typeFilter])

  useEffect(() => { void fetchReports() }, [fetchReports])

  const doResolve = async (reportId: string, action: ResolveAction) => {
    if (!accessToken) return
    setResolvingId(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
      }
    } finally {
      setResolvingId(null)
      setPendingAction(null)
    }
  }

  if (isLoading) return null
  if (!user || !['admin', 'moderator'].includes(user.role)) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">
          ← Panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded-lg p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === t.value ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded-lg p-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                typeFilter === t.value ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center text-gray-400">
          No hay reportes con esos filtros.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const badge = TYPE_BADGES[r.target_type]
            const isPending = r.status === 'pending'
            const isResolving = resolvingId === r.id
            return (
              <li key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {REASON_LABELS[r.reason ?? ''] ?? r.reason ?? '—'}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{timeAgo(r.created_at)}</span>
                  </div>
                  {!isPending && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {r.status === 'resolved' ? 'Resuelto' : 'Desestimado'}
                      {r.resolver?.username && ` por @${r.resolver.username}`}
                    </span>
                  )}
                </div>

                <div className="bg-gray-950/40 border border-gray-800 rounded-md p-3 mb-3">
                  <TargetDetailsView d={r.target_details} />
                </div>

                {r.description && (
                  <p className="text-sm text-gray-400 mb-3 italic">
                    «{r.description}»
                  </p>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-gray-500">
                    Reportado por{' '}
                    {r.reporter ? (
                      <Link href={`/user/${r.reporter.username}`} className="text-gray-400 hover:text-indigo-400">
                        @{r.reporter.username}
                      </Link>
                    ) : '[eliminado]'}
                  </p>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingAction({ reportId: r.id, action: 'dismiss' })}
                        disabled={isResolving}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
                      >
                        Desestimar
                      </button>
                      {r.target_type !== 'user' && (
                        <button
                          type="button"
                          onClick={() => setPendingAction({ reportId: r.id, action: 'remove_content' })}
                          disabled={isResolving}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-orange-900/60 hover:bg-orange-900 text-orange-200 disabled:opacity-50"
                        >
                          Eliminar contenido
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingAction({ reportId: r.id, action: 'ban_user' })}
                        disabled={isResolving}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-red-700 hover:bg-red-600 text-white disabled:opacity-50"
                      >
                        Banear usuario
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal de confirmación */}
      {pendingAction && (
        <ConfirmDialog
          action={pendingAction.action}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => doResolve(pendingAction.reportId, pendingAction.action)}
          pending={resolvingId === pendingAction.reportId}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de confirmación reutilizado para las 3 acciones
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_TEXTS: Record<ResolveAction, { title: string; body: string; cta: string; ctaClass: string }> = {
  dismiss: {
    title: 'Desestimar reporte',
    body: 'El reporte se marcará como desestimado sin tomar acción sobre el contenido.',
    cta: 'Desestimar',
    ctaClass: 'bg-gray-700 hover:bg-gray-600',
  },
  remove_content: {
    title: 'Eliminar contenido',
    body: 'El contenido reportado se eliminará (soft-delete). El reporte se marcará como resuelto.',
    cta: 'Eliminar',
    ctaClass: 'bg-orange-700 hover:bg-orange-600',
  },
  ban_user: {
    title: 'Banear usuario',
    body: 'El usuario relacionado será baneado y no podrá iniciar sesión. El reporte se marcará como resuelto.',
    cta: 'Banear',
    ctaClass: 'bg-red-700 hover:bg-red-600',
  },
}

function ConfirmDialog({
  action,
  onCancel,
  onConfirm,
  pending,
}: {
  action: ResolveAction
  onCancel: () => void
  onConfirm: () => void
  pending: boolean
}) {
  const t = ACTION_TEXTS[action]
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onCancel() }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">{t.title}</h2>
        <p className="text-sm text-gray-400 mb-5">{t.body}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${t.ctaClass}`}
          >
            {pending ? 'Procesando…' : t.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
