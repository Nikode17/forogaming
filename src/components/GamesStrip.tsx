import Link from 'next/link'

interface Game {
  id: string
  name: string
  slug: string
  cover_url: string | null
  post_count: number
}

interface Props {
  games: Game[]
}

export default function GamesStrip({ games }: Props) {
  const active = games.filter(g => g.cover_url).slice(0, 12)
  if (active.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Juegos más activos
        </h2>
        <Link href="/games" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Ver todos →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {active.map(game => (
          <Link
            key={game.id}
            href={`/game/${game.slug}`}
            className="group shrink-0 w-28 flex flex-col"
          >
            <div className="relative w-28 h-36 rounded-xl overflow-hidden border border-gray-800 group-hover:border-indigo-600/60 transition-colors">
              <img
                src={game.cover_url!}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Post count badge */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {game.post_count} posts
              </div>
            </div>
            <p className="mt-1.5 text-xs font-medium text-gray-300 group-hover:text-white truncate transition-colors text-center">
              {game.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
