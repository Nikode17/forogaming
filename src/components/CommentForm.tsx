'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess?: () => void
}

export default function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const { user, accessToken } = useAuth()
  const { openLogin } = useAuthModal()
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="text-sm text-gray-500 py-2">
        <button
          type="button"
          onClick={openLogin}
          className="text-indigo-400 hover:text-indigo-300"
        >
          Inicia sesión
        </button>{' '}
        para comentar.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          body: trimmed,
          parent_id: parentId ?? null,
        }),
      })

      const data = await res.json() as { error?: { message: string } }
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'Error al publicar comentario')
      }

      setBody('')
      onSuccess?.()
      // Recargar para mostrar el nuevo comentario
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? 'Escribe tu respuesta...' : 'Escribe un comentario...'}
        rows={parentId ? 2 : 3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !body.trim()}
          className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publicando...' : 'Comentar'}
        </button>
      </div>
    </form>
  )
}

export type { CommentFormProps }
