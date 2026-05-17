'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string  // ej. "este post", "el comentario de @bob"
}

interface ReasonOption {
  value: 'spam' | 'harassment' | 'hate_speech' | 'inappropriate_content' | 'misinformation' | 'other'
  label: string
}

const REASONS: ReasonOption[] = [
  { value: 'spam',                   label: 'Spam' },
  { value: 'harassment',             label: 'Acoso o intimidación' },
  { value: 'hate_speech',            label: 'Discurso de odio' },
  { value: 'inappropriate_content',  label: 'Contenido inapropiado' },
  { value: 'misinformation',         label: 'Desinformación' },
  { value: 'other',                  label: 'Otro' },
]

const DEFAULT_LABELS: Record<ReportTargetType, string> = {
  post: 'este post',
  comment: 'este comentario',
  user: 'este usuario',
  message: 'este mensaje',
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const { accessToken } = useAuth()
  const [reason, setReason] = useState<ReasonOption['value']>('spam')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setReason('spam')
      setDescription('')
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [isOpen])

  // Body scroll lock + Escape
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'submitting') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose, status])

  // Autocierre tras success
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(onClose, 2000)
      return () => clearTimeout(t)
    }
  }, [status, onClose])

  if (!isOpen) return null

  const submit = async () => {
    if (!accessToken) {
      setStatus('error')
      setErrorMsg('Necesitas iniciar sesión')
      return
    }
    setStatus('submitting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          description: description.trim() || undefined,
        }),
      })
      if (res.ok) {
        setStatus('success')
        return
      }
      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string } } | null
      setStatus('error')
      setErrorMsg(data?.error?.message ?? 'Error al enviar el reporte')
    } catch {
      setStatus('error')
      setErrorMsg('Error de conexión')
    }
  }

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && status !== 'submitting') onClose()
  }

  const label = targetLabel ?? DEFAULT_LABELS[targetType]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Reportar contenido"
      onClick={onBackdrop}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">
            Reportar {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'submitting'}
            aria-label="Cerrar"
            className="text-gray-500 hover:text-gray-200 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {status === 'success' ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-900/40 flex items-center justify-center mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-gray-100 font-medium">Reporte enviado</p>
            <p className="text-sm text-gray-500 mt-1">Lo revisaremos pronto. Gracias.</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              {/* Motivo */}
              <fieldset>
                <legend className="text-sm font-medium text-gray-300 mb-2">Motivo</legend>
                <div className="space-y-1.5">
                  {REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800/60 cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        disabled={status === 'submitting'}
                        className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-200">{r.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Descripción */}
              <div>
                <label htmlFor="report-description" className="block text-sm font-medium text-gray-300 mb-1">
                  Cuéntanos más <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  disabled={status === 'submitting'}
                  rows={4}
                  placeholder="Detalles adicionales que ayuden a entender el problema…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500 text-right tabular-nums">
                  {description.length}/1000
                </p>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'submitting'}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={status === 'submitting'}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
              >
                {status === 'submitting' ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
