import Feed from '@/components/Feed'
import Sidebar from '@/components/Sidebar'
import type { PostCardProps } from '@/components/PostCard'

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

interface GameItem {
  id: string
  name: string
  slug: string
  cover_url: string | null
  post_count: number
}

interface SearchResponse {
  data: PostCardProps['post'][]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  if (!q) return { title: 'Buscar — Respawn' }
  return {
    title: `Resultados para "${q}" — Respawn`,
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page = '1' } = await searchParams

  const gamesData = await apiFetch<{ data: GameItem[] }>('/api/games')
  const games = gamesData?.data ?? []

  // Sin query: pagina de busqueda inicial
  if (!q || q.trim() === '') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <div className="hidden lg:block">
          <Sidebar games={games} />
        </div>
        <main className="flex-1 min-w-0">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-6">&#128269;</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Que estas buscando?
            </h1>
            <p className="text-gray-400 mb-8 text-center max-w-md">
              Busca guias, easter eggs, reviews y mas en la comunidad de Respawn.
            </p>
            <form action="/search" method="GET" className="w-full max-w-lg flex gap-2">
              <input
                name="q"
                type="text"
                placeholder="Buscar guias, easter eggs, reviews..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  // Con query: buscar posts
  const searchData = await apiFetch<SearchResponse>(
    `/api/posts/search?q=${encodeURIComponent(q)}&page=${page}`
  )

  const posts = searchData?.data ?? []
  const pagination = searchData?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      <div className="hidden lg:block">
        <Sidebar games={games} />
      </div>
      <main className="flex-1 min-w-0">
        {/* Barra de busqueda */}
        <form action="/search" method="GET" className="mb-6 flex gap-2">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Buscar guias, easter eggs, reviews..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Header de resultados */}
        <h1 className="text-xl font-bold text-gray-100 mb-6">
          Resultados para &ldquo;{q}&rdquo;{' '}
          <span className="text-gray-500 font-normal text-base">
            ({pagination.total} total)
          </span>
        </h1>

        {/* Resultados o mensaje vacio */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">&#128533;</div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">
              No se encontraron posts para &ldquo;{q}&rdquo;
            </h2>
            <p className="text-sm text-gray-500">
              Intenta con otras palabras o revisa la ortografia.
            </p>
          </div>
        ) : (
          <Feed
            posts={posts}
            pagination={pagination}
            baseUrl={`/search?q=${encodeURIComponent(q)}&page=`}
          />
        )}
      </main>
    </div>
  )
}
