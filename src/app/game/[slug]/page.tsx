import Link from 'next/link'
import { notFound } from 'next/navigation'
import Feed from '@/components/Feed'
import Sidebar from '@/components/Sidebar'

async function fetchFromApi(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const categoryTabs = [
  { label: 'Todos', value: '' },
  { label: 'Guias', value: 'guide' },
  { label: 'Easter Eggs', value: 'easter-egg' },
  { label: 'Reviews', value: 'review' },
]

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { slug } = await params
  const { page = '1', category } = await searchParams

  const categoryParam = category ? `&category=${category}` : ''
  const [gameData, postsData, gamesData] = await Promise.all([
    fetchFromApi(`/api/games/${slug}`),
    fetchFromApi(`/api/posts?game=${slug}&page=${page}${categoryParam}&limit=20`),
    fetchFromApi('/api/games'),
  ])

  if (!gameData) {
    notFound()
  }

  const game = gameData.game ?? gameData
  const posts = postsData?.data ?? []
  const pagination = postsData?.pagination ?? { page: Number(page), limit: 20, total: 0, totalPages: 1 }
  const games = Array.isArray(gamesData?.data) ? gamesData.data : []

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Game header */}
      <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {game.cover_url && (
          <div className="h-48 relative">
            <img
              src={game.cover_url}
              alt={game.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          </div>
        )}
        <div className={`p-6 ${game.cover_url ? '-mt-16 relative z-10' : ''}`}>
          <h1 className="text-3xl font-bold text-white mb-2">{game.name}</h1>
          {game.description && (
            <p className="text-sm text-gray-400 mb-3 max-w-2xl">{game.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{game.post_count ?? pagination.total} posts</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="hidden lg:block">
          <Sidebar games={games} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Category tabs */}
          <div className="flex items-center gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {categoryTabs.map((tab) => {
              const isActive = (category ?? '') === tab.value
              const href = tab.value
                ? `/game/${slug}?category=${tab.value}`
                : `/game/${slug}`
              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          <Feed
            posts={posts}
            pagination={pagination}
            baseUrl={`/game/${slug}?${category ? `category=${category}&` : ''}page=`}
          />
        </div>
      </div>
    </main>
  )
}
