import Link from 'next/link'
import PostCard from '@/components/PostCard'
import type { PostCardProps } from '@/components/PostCard'

interface FeedProps {
  posts: PostCardProps['post'][]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  currentPage?: number
  baseUrl?: string
}

export default function Feed({ posts, pagination, currentPage, baseUrl = '/?page=' }: FeedProps) {
  const page = currentPage ?? pagination.page

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay posts todavía</h3>
        <p className="text-sm text-gray-500">
          ¡Sé el primero en publicar!
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Crear post
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Lista de posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          {page > 1 ? (
            <Link
              href={`${baseUrl}${page - 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              &larr; Anterior
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-800/50 border border-gray-800 rounded-lg cursor-not-allowed">
              &larr; Anterior
            </span>
          )}

          <span className="text-sm text-gray-500">
            Página {page} de {pagination.totalPages}
          </span>

          {page < pagination.totalPages ? (
            <Link
              href={`${baseUrl}${page + 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              Siguiente &rarr;
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-800/50 border border-gray-800 rounded-lg cursor-not-allowed">
              Siguiente &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export type { FeedProps }
