'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import FollowButton from '@/components/FollowButton'

interface Props {
  username: string
  initialFollowing: boolean
  initialCount: number
}

export default function ProfileActions({ username, initialFollowing, initialCount }: Props) {
  const { user } = useAuth()
  const isOwn = user?.username === username

  if (isOwn) {
    return (
      <Link
        href="/settings"
        className="px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors"
      >
        Editar perfil
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <FollowButton
        username={username}
        initialFollowing={initialFollowing}
        initialCount={initialCount}
      />
      <Link
        href={`/messages/${username}`}
        className="px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors"
      >
        Mensaje
      </Link>
    </div>
  )
}
