import { notFound } from 'next/navigation'
import type React from 'react'
import type { PostCardProps } from '@/components/PostCard'
import ProfileActions from '@/components/ProfileActions'
import ProfileTabs from '@/components/ProfileTabs'

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
  friends_count: number
}

interface UserResponse {
  user: UserData
  posts: PostCardProps['post'][]
  post_count: number
  is_following: boolean
}

const roleBadges: Record<string, { bg: string; label: string }> = {
  admin: { bg: 'bg-red-900/60 text-red-300 border border-red-800', label: 'Admin' },
  moderator: { bg: 'bg-yellow-900/60 text-yellow-300 border border-yellow-800', label: 'Moderador' },
  user: { bg: 'bg-gray-700/60 text-gray-300 border border-gray-600', label: 'Usuario' },
  guest: { bg: 'bg-gray-800/60 text-gray-500 border border-gray-700', label: 'Invitado' },
}

const coverGradients = [
  'from-indigo-950 via-purple-950 to-slate-950',
  'from-blue-950 via-sky-950 to-slate-950',
  'from-violet-950 via-fuchsia-950 to-slate-950',
  'from-emerald-950 via-teal-950 to-slate-950',
  'from-rose-950 via-pink-950 to-slate-950',
  'from-amber-950 via-orange-950 to-slate-950',
]

function getCoverGradient(username: string): string {
  const idx = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % coverGradients.length
  return coverGradients[idx]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
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

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const data = await apiFetch<UserResponse>(`/api/users/${username}`)
  if (!data) return notFound()

  const { user, posts, post_count, is_following } = data
  const role = roleBadges[user.role] ?? roleBadges.user
  const coverGradient = getCoverGradient(user.username)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Banned notice */}
      {user.is_banned && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-300 font-medium">
          Este usuario ha sido baneado.
        </div>
      )}

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">

        {/* Cover */}
        <div className={`relative h-40 bg-gradient-to-br ${coverGradient} overflow-hidden`}>
          {/* Decorative glows */}
          <div className="absolute -right-6 -top-6 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-8 top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>

        {/* Avatar + actions row */}
        <div className="px-6 -mt-12 mb-4 flex items-end justify-between gap-3">
          {/* Avatar */}
          <div className="ring-4 ring-gray-900 rounded-full shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pb-1">
            <ProfileActions
              username={user.username}
              initialFollowing={is_following}
              initialCount={user.followers_count}
            />
          </div>
        </div>

        {/* User info */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-gray-100">{user.username}</h1>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${role.bg}`}>
              {role.label}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Miembro desde {formatDate(user.created_at)}
          </p>

          {user.bio && (
            <p className="text-sm text-gray-300 mb-5 leading-relaxed">{user.bio}</p>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard value={post_count} label="Posts" icon={<IconPost />} />
            <StatCard value={user.followers_count} label="Seguidores" icon={<IconUsers />} />
            <StatCard value={user.following_count} label="Siguiendo" icon={<IconFollow />} />
            <StatCard value={user.friends_count} label="Amigos" icon={<IconFriends />} />
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <ProfileTabs
        username={user.username}
        posts={posts}
        postCount={post_count}
      />
    </div>
  )
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1.5 text-indigo-400">{icon}</div>
      <div className="text-xl font-bold text-gray-100">{value.toLocaleString('es-ES')}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function IconPost() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}
function IconUsers() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IconFollow() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
}
function IconFriends() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
}
