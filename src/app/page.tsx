import Link from 'next/link'
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>
}) {
  const { page = '1', sort = 'new' } = await searchParams

  const [postsData, trendingData, gamesData] = await Promise.all([
    fetchFromApi(`/api/posts?sort=${sort}&page=${page}&limit=20`),
    fetchFromApi('/api/posts/trending'),
    fetchFromApi('/api/games'),
  ])

  const posts = postsData?.data ?? []
  const pagination = postsData?.pagination ?? { page: Number(page), limit: 20, total: 0, totalPages: 1 }
  const trending = trendingData?.data ?? []
  const games = Array.isArray(gamesData?.data) ? gamesData.data : []

  const sortTabs = [
    { label: 'Nuevo', value: 'new' },
    { label: 'Top', value: 'top' },
    { label: 'Trending', value: 'trending' },
  ]

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Trending bar */}
      {Array.isArray(trending) && trending.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-800/40 rounded-lg p-4">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
            {trending.slice(0, 5).map((post: { id: string; title: string; upvotes: number; downvotes: number; game?: { name: string } | null }, i: number) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex-shrink-0 flex items-start gap-3 min-w-[250px] max-w-[320px] p-3 bg-gray-900/60 border border-gray-800 rounded-lg hover:border-indigo-600/50 transition-colors"
              >
                <span className="text-2xl font-black text-indigo-500/60">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 line-clamp-2">{post.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.game?.name ?? 'General'} &middot; {post.upvotes - post.downvotes} puntos
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar games={games} />
        </div>

        {/* Feed */}
        <div className="flex-1 min-w-0">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {sortTabs.map((tab) => (
              <Link
                key={tab.value}
                href={`/?sort=${tab.value}`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sort === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <Feed
            posts={posts}
            pagination={pagination}
            baseUrl={`/?sort=${sort}&page=`}
          />
        </div>
      </div>
    </main>
  )
}
