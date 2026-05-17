import Link from 'next/link'
import Feed from '@/components/Feed'
import Sidebar from '@/components/Sidebar'
import GuestCTA from '@/components/GuestCTA'
import { serverApiFetch } from '@/lib/server-auth'

// El feed y el listado de juegos vienen sin tipar estrictamente porque el código
// consumidor (Feed, Sidebar, etc.) asume shapes implícitos. Refactor a tipos
// estrictos sería un cambio aparte fuera del scope del layout.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiAny = any

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    sort?: string
    q?: string
    category?: string
    game?: string
  }>
}) {
  const sp = await searchParams
  const page = sp.page ?? '1'
  const sort = sp.sort ?? 'new'

  // Construir la URL del fetch al endpoint preservando todos los filtros
  const apiQs = new URLSearchParams()
  apiQs.set('sort', sort)
  apiQs.set('page', page)
  apiQs.set('limit', '20')
  if (sp.q?.trim())        apiQs.set('q', sp.q.trim())
  if (sp.category)         apiQs.set('category', sp.category)
  if (sp.game)             apiQs.set('game', sp.game)

  const [postsData, gamesData] = await Promise.all([
    serverApiFetch<ApiAny>(`/api/posts?${apiQs.toString()}`, { next: { revalidate: 60 } }),
    serverApiFetch<ApiAny>('/api/games?limit=100', { next: { revalidate: 60 } }),
  ])

  const posts      = postsData?.data ?? []
  const pagination = postsData?.pagination ?? { page: Number(page), limit: 20, total: 0, totalPages: 1 }
  const allGames   = Array.isArray(gamesData?.data) ? gamesData.data : []

  // Top juegos por post_count para la sidebar
  const topGames = [...allGames]
    .sort((a: { post_count: number }, b: { post_count: number }) => b.post_count - a.post_count)

  // baseUrl de paginación: preserva todos los filtros activos
  const paginationQs = new URLSearchParams()
  paginationQs.set('sort', sort)
  if (sp.q?.trim())  paginationQs.set('q', sp.q.trim())
  if (sp.category)   paginationQs.set('category', sp.category)
  if (sp.game)       paginationQs.set('game', sp.game)
  const baseUrl = `/?${paginationQs.toString()}${paginationQs.toString() ? '&' : ''}page=`

  // Etiqueta del filtro activo para feedback visual
  const activeGameObj = sp.game ? topGames.find((g: { slug: string }) => g.slug === sp.game) : null
  const activeFilters: string[] = []
  if (sp.q?.trim())  activeFilters.push(`"${sp.q.trim()}"`)
  if (sp.category)   activeFilters.push(sp.category)
  if (activeGameObj) activeFilters.push(activeGameObj.name)

  return (
    <div className="flex">
      <Sidebar games={topGames} />

      <div className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <GuestCTA />

          {/* Indicador de filtros activos */}
          {activeFilters.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap text-sm">
              <span className="text-gray-500">Filtros:</span>
              {activeFilters.map((f, i) => (
                <span key={i} className="bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded">
                  {f}
                </span>
              ))}
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-white underline-offset-2 hover:underline"
              >
                limpiar
              </Link>
            </div>
          )}

          <Feed posts={posts} pagination={pagination} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  )
}
