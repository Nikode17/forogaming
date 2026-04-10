import Link from 'next/link'
import { notFound } from 'next/navigation'
import Feed from '@/components/Feed'
import Sidebar from '@/components/Sidebar'
import { getIGDBGameDetails, igdbCoverUrl } from '@/lib/igdb'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function fetchFromApi(path: string) {
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
  { label: 'Guías', value: 'guide' },
  { label: 'Easter Eggs', value: 'easter-egg' },
  { label: 'Reviews', value: 'review' },
]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const gameData = await fetchFromApi(`/api/games/${slug}`)
  if (!gameData) return { title: 'Juego no encontrado — Forogaming' }
  const game = gameData.data ?? gameData.game ?? gameData
  return {
    title: `${game.name} — Forogaming`,
    description: game.description ?? `Posts, guías y reviews de ${game.name} en Forogaming.`,
  }
}

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

  if (!gameData) notFound()

  const game = gameData.data ?? gameData.game ?? gameData
  const posts = postsData?.data ?? []
  const pagination = postsData?.pagination ?? { page: Number(page), limit: 20, total: 0, totalPages: 1 }
  const games = Array.isArray(gamesData?.data) ? gamesData.data : []

  // Enriquecer con IGDB (falla silenciosamente si no hay datos)
  const igdb = await getIGDBGameDetails(game.name).catch(() => null)

  const coverUrl = igdb?.cover?.image_id
    ? igdbCoverUrl(igdb.cover.image_id, 'cover_big')
    : game.cover_url

  const screenshots = igdb?.screenshots?.slice(0, 6) ?? []
  const genres = igdb?.genres?.map((g: { name: string }) => g.name) ?? []
  const platforms = igdb?.platforms?.map((p: { name: string }) => p.name).slice(0, 4) ?? []
  const developer = igdb?.involved_companies?.find((c: { developer: boolean }) => c.developer)?.company?.name ?? null
  const releaseYear = igdb?.first_release_date
    ? new Date(igdb.first_release_date * 1000).getFullYear()
    : null
  const rating = igdb?.total_rating ? Math.round(igdb.total_rating) : null
  const summary = igdb?.summary ?? game.description

  // Color de acento basado en si hay datos de IGDB (podría personalizarse)
  const postCount = pagination.total

  return (
    <main>
      {/* ── HERO ── */}
      <div className="relative w-full overflow-hidden">
        {/* Fondo: screenshot desenfocado o color sólido */}
        {screenshots[0] ? (
          <div className="absolute inset-0">
            <img
              src={`https://images.igdb.com/igdb/image/upload/t_screenshot_big/${screenshots[0].image_id}.jpg`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Portada */}
            {coverUrl && (
              <div className="shrink-0">
                <img
                  src={coverUrl}
                  alt={game.name}
                  className="w-36 sm:w-44 rounded-lg shadow-2xl border border-white/10"
                  style={{ aspectRatio: '3/4', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Géneros */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {genres.map((g: string) => (
                    <span key={g} className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                {game.name}
              </h1>

              {/* Metadatos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
                {releaseYear && <span>{releaseYear}</span>}
                {developer && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{developer}</span>
                  </>
                )}
                {platforms.length > 0 && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{platforms.join(', ')}</span>
                  </>
                )}
              </div>

              {/* Rating + posts */}
              <div className="flex items-center gap-4 mb-5">
                {rating !== null && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2"
                      style={{
                        borderColor: rating >= 75 ? '#22c55e' : rating >= 50 ? '#eab308' : '#ef4444',
                        color:       rating >= 75 ? '#22c55e' : rating >= 50 ? '#eab308' : '#ef4444',
                      }}
                    >
                      {rating}
                    </div>
                    <span className="text-xs text-gray-500">
                      Rating IGDB<br />
                      {igdb?.total_rating_count ?? 0} votos
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  <span className="text-2xl font-bold text-white">{postCount}</span>
                  <span className="ml-1">posts en el foro</span>
                </div>
              </div>

              {/* Descripción */}
              {summary && (
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 max-w-2xl">
                  {summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SCREENSHOTS ── */}
      {screenshots.length > 0 && (
        <div className="bg-gray-950 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {screenshots.map((s: { image_id: string }, i: number) => (
                <img
                  key={i}
                  src={`https://images.igdb.com/igdb/image/upload/t_screenshot_med/${s.image_id}.jpg`}
                  alt={`Screenshot ${i + 1}`}
                  className="h-24 w-auto rounded-md shrink-0 border border-gray-800 hover:border-indigo-600 transition-colors cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POSTS ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="hidden lg:block">
            <Sidebar games={games} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Tabs categoría */}
            <div className="flex items-center gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1">
              {categoryTabs.map((tab) => {
                const isActive = (category ?? '') === tab.value
                const href = tab.value ? `/game/${slug}?category=${tab.value}` : `/game/${slug}`
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

              <Link
                href={`/submit?game=${slug}`}
                className="ml-auto px-4 py-2 text-sm font-medium bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 rounded-md transition-colors"
              >
                + Crear post
              </Link>
            </div>

            <Feed
              posts={posts}
              pagination={pagination}
              baseUrl={`/game/${slug}?${category ? `category=${category}&` : ''}page=`}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
