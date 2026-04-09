import Link from 'next/link'

interface SidebarProps {
  games?: Array<{
    id: string
    name: string
    slug: string
    cover_url: string | null
    post_count: number
  }>
}

const categories = [
  { label: 'Inicio - todas', href: '/', icon: '🏠' },
  { label: 'Guías', href: '/category/guide', icon: '📖' },
  { label: 'Easter Eggs', href: '/category/easter-egg', icon: '🥚' },
  { label: 'Reviews', href: '/category/review', icon: '⭐' },
]

export default function Sidebar({ games = [] }: SidebarProps) {
  const displayedGames = games.slice(0, 10)
  const hasMore = games.length > 10

  return (
    <aside className="w-64 shrink-0 space-y-4">
      {/* Categorías */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Categorías
        </h2>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.href}>
              <Link
                href={cat.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Juegos */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Juegos
        </h2>
        {displayedGames.length === 0 ? (
          <p className="text-sm text-gray-500 px-3">No hay juegos disponibles.</p>
        ) : (
          <ul className="space-y-1">
            {displayedGames.map((game) => (
              <li key={game.id}>
                <Link
                  href={`/game/${game.slug}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.name}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
                      🎮
                    </div>
                  )}
                  <span className="truncate">{game.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{game.post_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <Link
            href="/games"
            className="block mt-3 px-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Ver todos los juegos &rarr;
          </Link>
        )}
      </div>
    </aside>
  )
}
