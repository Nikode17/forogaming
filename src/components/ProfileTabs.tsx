'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import type { PostCardProps } from '@/components/PostCard'
import UserAvatar from '@/components/UserAvatar'

interface FavoritePost {
  id: string
  title: string
  category: string
  created_at: string
  author_username: string | null
  game_name: string | null
  game_slug: string | null
}

interface Friend {
  id: string
  username: string
  avatar_url: string | null
  last_seen: string | null
}

interface Props {
  username: string
  posts: PostCardProps['post'][]
  postCount: number
}

type Tab = 'posts' | 'favoritos' | 'amigos'

export default function ProfileTabs({ username, posts, postCount }: Props) {
  const { user, accessToken } = useAuth()
  const isOwn = user?.username === username

  const [tab, setTab] = useState<Tab>('posts')
  const [favorites, setFavorites] = useState<FavoritePost[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loadingFav, setLoadingFav] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [fetchedFav, setFetchedFav] = useState(false)
  const [fetchedFriends, setFetchedFriends] = useState(false)

  useEffect(() => {
    if (tab === 'favoritos' && isOwn && accessToken && !fetchedFav) {
      setLoadingFav(true)
      fetch('/api/users/me/favorites?limit=20', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then((d: { data: FavoritePost[] } | null) => {
          if (d) setFavorites(d.data)
          setFetchedFav(true)
        })
        .finally(() => setLoadingFav(false))
    }
  }, [tab, isOwn, accessToken, fetchedFav])

  useEffect(() => {
    if (tab === 'amigos' && isOwn && accessToken && !fetchedFriends) {
      setLoadingFriends(true)
      fetch('/api/friends', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then((d: { friends: Friend[] } | null) => {
          if (d) setFriends(d.friends)
          setFetchedFriends(true)
        })
        .finally(() => setLoadingFriends(false))
    }
  }, [tab, isOwn, accessToken, fetchedFriends])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'posts', label: `Posts (${postCount})` },
    ...(isOwn ? [
      { id: 'favoritos' as Tab, label: 'Favoritos' },
      { id: 'amigos' as Tab, label: 'Amigos' },
    ] : []),
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        posts.length === 0 ? (
          <Empty message="Este usuario no ha publicado nada todavía." />
        ) : (
          <div className="space-y-3">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )
      )}

      {/* Favoritos */}
      {tab === 'favoritos' && (
        loadingFav ? <Spinner /> :
        favorites.length === 0 ? (
          <Empty message="No tienes posts guardados." />
        ) : (
          <div className="space-y-2">
            {favorites.map(fav => (
              <Link
                key={fav.id}
                href={`/post/${fav.id}`}
                className="flex items-start gap-3 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg px-4 py-3 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 group-hover:text-white truncate">
                    {fav.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-indigo-400 capitalize">{fav.category}</span>
                    {fav.game_name && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">{fav.game_name}</span>
                      </>
                    )}
                    {fav.author_username && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-600">@{fav.author_username}</span>
                      </>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Amigos */}
      {tab === 'amigos' && (
        loadingFriends ? <Spinner /> :
        friends.length === 0 ? (
          <Empty message="Todavía no tienes amigos. ¡Busca usuarios en la página de amigos!" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {friends.map(f => (
              <Link
                key={f.id}
                href={`/user/${f.username}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg px-4 py-3 flex items-center gap-3 transition-colors group"
              >
                <UserAvatar
                  username={f.username}
                  avatarUrl={f.avatar_url}
                  lastSeen={f.last_seen}
                  size={40}
                />
                <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                  {f.username}
                </span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
