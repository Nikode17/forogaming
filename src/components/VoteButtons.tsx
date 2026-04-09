'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface VoteButtonsProps {
  targetType: 'post' | 'comment'
  targetId: string
  initialUpvotes: number
  initialDownvotes: number
  vertical?: boolean
}

type VoteState = 'up' | 'down' | null

export default function VoteButtons({
  targetType,
  targetId,
  initialUpvotes,
  initialDownvotes,
  vertical = true,
}: VoteButtonsProps) {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [currentVote, setCurrentVote] = useState<VoteState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const score = upvotes - downvotes

  async function handleVote(direction: 'up' | 'down') {
    if (!user) {
      router.push('/login')
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      if (currentVote === direction) {
        // Quitar voto
        await fetch('/api/votes', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ target_type: targetType, target_id: targetId }),
        })
        // Optimistic update
        if (direction === 'up') setUpvotes((v) => v - 1)
        else setDownvotes((v) => v - 1)
        setCurrentVote(null)
      } else {
        // Crear o cambiar voto
        await fetch('/api/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ target_type: targetType, target_id: targetId, value: direction === 'up' ? 1 : -1 }),
        })
        // Optimistic update
        if (currentVote === 'up') setUpvotes((v) => v - 1)
        if (currentVote === 'down') setDownvotes((v) => v - 1)
        if (direction === 'up') setUpvotes((v) => v + 1)
        else setDownvotes((v) => v + 1)
        setCurrentVote(direction)
      }
    } catch {
      // Revertir en caso de error - recargar para obtener estado real
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerClass = vertical
    ? 'flex flex-col items-center gap-1'
    : 'flex items-center gap-2'

  return (
    <div className={containerClass}>
      <button
        onClick={() => handleVote('up')}
        disabled={isSubmitting}
        className={`transition-colors font-bold text-lg leading-none ${
          currentVote === 'up'
            ? 'text-indigo-400'
            : 'text-gray-500 hover:text-indigo-400'
        } disabled:opacity-50`}
        aria-label="Upvote"
      >
        &#9650;
      </button>
      <span
        className={`text-sm font-bold ${
          score > 0
            ? 'text-indigo-400'
            : score < 0
              ? 'text-red-400'
              : 'text-gray-400'
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => handleVote('down')}
        disabled={isSubmitting}
        className={`transition-colors font-bold text-lg leading-none ${
          currentVote === 'down'
            ? 'text-red-400'
            : 'text-gray-500 hover:text-red-400'
        } disabled:opacity-50`}
        aria-label="Downvote"
      >
        &#9660;
      </button>
    </div>
  )
}

export type { VoteButtonsProps }
