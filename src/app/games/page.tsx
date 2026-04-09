import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface Game {
  id: string
  name: string
  slug: string
  cover_url: string | null
  description: string | null
  post_count: number
}

async function fetchGames(): Promise<Game[]> {
  try {
    const res = await fetch(`${baseUrl}/api/games?limit=100`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json() as { data: Game[] }
    return data.data ?? []
  } catch {
    return []
  }
}

export const metadata = {
  title: 'Todos los juegos — Forogaming',
  description: 'Explora todos los juegos del foro.',
}

export default async function GamesPage() {
  const games = await fetchGames()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Todos los juegos</h1>
        <span className="text-sm text-gray-500">{games.length} juegos</span>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400 mb-2">No hay juegos todavía.</p>
          <p className="text-sm text-gray-600">Los juegos aparecen aquí cuando se crean posts asociados a ellos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.slug}`}
              className="group flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-indigo-600/50 transition-colors"
            >
              {/* Portada */}
              <div className="aspect-[3/4] bg-gray-800 overflow-hidden">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">
                    🎮
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-200 line-clamp-2 leading-tight">
                  {game.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {game.post_count} {game.post_count === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
