import { notFound } from 'next/navigation'
import Link from 'next/link'
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

const CATEGORIES = {
  guide: { label: 'Guias', description: 'Tutoriales, walkthroughs y consejos para tus juegos favoritos.' },
  'easter-egg': { label: 'Easter Eggs', description: 'Secretos escondidos, referencias y curiosidades en videojuegos.' },
  review: { label: 'Reviews', description: 'Analisis y opiniones sobre videojuegos.' },
  general: { label: 'General', description: 'Discusion general sobre videojuegos y la comunidad.' },
} as const

type ValidCategory = keyof typeof CATEGORIES

const SORT_OPTIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'top', label: 'Top' },
  { value: 'trending', label: 'Trending' },
] as const

interface GameItem {
  id: string
  name: string
  slug: string
  cover_url: string | null
  post_count: number
}

interface PostsResponse {
  data: PostCardProps['post'][]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!(type in CATEGORIES)) return { title: 'Categoria no encontrada — Respawn' }
  const cat = CATEGORIES[type as ValidCategory]
  return {
    title: `${cat.label} — Respawn`,
    description: cat.description,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}) {
  const { type } = await params
  const { page = '1', sort = 'new' } = await searchParams

  if (!(type in CATEGORIES)) notFound()
  const category = type as ValidCategory
  const catInfo = CATEGORIES[category]

  const [postsData, gamesData] = await Promise.all([
    apiFetch<PostsResponse>(`/api/posts?category=${category}&page=${page}&sort=${sort}`),
    apiFetch<{ data: GameItem[] }>('/api/games'),
  ])

  const posts = postsData?.data ?? []
  const pagination = postsData?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 }
  const games = gamesData?.data ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar games={games} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-1">{catInfo.label}</h1>
          <p className="text-sm text-gray-400">{catInfo.description}</p>
        </div>

        {/* Tabs de ordenacion */}
        <div className="flex items-center gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/category/${type}?sort=${opt.value}&page=1`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                sort === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Feed */}
        <Feed
          posts={posts}
          pagination={pagination}
          baseUrl={`/category/${type}?sort=${sort}&page=`}
        />
      </main>
    </div>
  )
}
