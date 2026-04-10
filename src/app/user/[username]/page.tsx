import { notFound } from 'next/navigation'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import type { PostCardProps } from '@/components/PostCard'
import FollowButton from '@/components/FollowButton'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 60 }, ...opts })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

interface UserData {
  id: string
  username: string
  role: 'admin' | 'moderator' | 'user' | 'guest'
  avatar_url: string | null
  bio: string | null
  is_banned: boolean
  created_at: string
  followers_count: number
  following_count: number
}

interface UserResponse {
  user: UserData
  posts: PostCardProps['post'][]
  post_count: number
  is_following: boolean
}

const roleBadges: Record<string, { bg: string; label: string }> = {
  admin: { bg: 'bg-red-900 text-red-300', label: 'Admin' },
  moderator: { bg: 'bg-yellow-900 text-yellow-300', label: 'Moderador' },
  user: { bg: 'bg-gray-700 text-gray-300', label: 'Usuario' },
  guest: { bg: 'bg-gray-800 text-gray-500', label: 'Invitado' },
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const data = await apiFetch<UserResponse>(`/api/users/${username}`)
  if (!data) return { title: 'Usuario no encontrado — Forogaming' }
  return {
    title: `${data.user.username} — Forogaming`,
    description: data.user.bio ?? `Perfil de ${data.user.username} en Forogaming.`,
  }
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const data = await apiFetch<UserResponse>(`/api/users/${username}`)
  if (!data) return notFound()

  const { user, posts, post_count, is_following } = data
  const role = roleBadges[user.role] ?? roleBadges.user

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Perfil */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        {user.is_banned && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-300 font-medium">
            Este usuario ha sido baneado.
          </div>
        )}

        <div className="flex items-start gap-5">
          {/* Avatar */}
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-100">{user.username}</h1>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${role.bg}`}>
                  {role.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FollowButton
                  username={user.username}
                  initialFollowing={is_following}
                  initialCount={user.followers_count}
                />
                <Link
                  href={`/messages/${user.username}`}
                  className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  Mensaje
                </Link>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              Miembro desde {formatDate(user.created_at)}
            </p>

            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="text-gray-400">
                <span className="font-semibold text-gray-100">{user.followers_count}</span> seguidores
              </span>
              <span className="text-gray-400">
                <span className="font-semibold text-gray-100">{user.following_count}</span> siguiendo
              </span>
              <span className="text-gray-400">
                <span className="font-semibold text-gray-100">{post_count}</span> posts
              </span>
            </div>

            {user.bio && (
              <p className="text-sm text-gray-300">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts del usuario */}
      <section>
        <h2 className="text-xl font-bold text-gray-100 mb-4">
          Posts de @{user.username}{' '}
          <span className="text-gray-500 font-normal text-base">
            ({post_count} posts)
          </span>
        </h2>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-3xl mb-3">&#128221;</div>
            <p className="text-gray-400">Este usuario no ha publicado nada todavia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
