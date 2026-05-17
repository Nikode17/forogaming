import Link from 'next/link'
import UserActionsMenu from '@/components/UserActionsMenu'

interface PostCardProps {
  post: {
    id: string
    title: string
    category: string
    author: { id?: string; username: string; avatar_url: string | null } | null
    game: { name: string; slug: string } | null
    upvotes: number
    downvotes: number
    comment_count: number
    view_count?: number
    created_at: string
  }
}

const categoryStyles: Record<string, { bg: string; text: string; label: string }> = {
  guide:       { bg: 'bg-blue-900/50',   text: 'text-blue-300',   label: 'Guía' },
  'easter-egg': { bg: 'bg-yellow-900/50', text: 'text-yellow-300', label: 'Easter Egg' },
  review:      { bg: 'bg-green-900/50',  text: 'text-green-300',  label: 'Review' },
  general:     { bg: 'bg-gray-700/50',   text: 'text-gray-300',   label: 'General' },
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} días`
}

export default function PostCard({ post }: PostCardProps) {
  const score = post.upvotes - post.downvotes
  const style = categoryStyles[post.category] ?? categoryStyles.general

  return (
    <article className="flex bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
      {/* Columna de votos */}
      <div className="flex flex-col items-center justify-start gap-1 px-3 py-3 bg-gray-850 rounded-l-lg min-w-[3rem]">
        <button className="text-gray-500 hover:text-indigo-400 transition-colors" aria-label="Upvote">
          &#9650;
        </button>
        <span className={`text-sm font-bold ${score > 0 ? 'text-indigo-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {score}
        </span>
        <button className="text-gray-500 hover:text-red-400 transition-colors" aria-label="Downvote">
          &#9660;
        </button>
      </div>

      {/* Columna principal */}
      <div className="flex-1 py-3 pr-4 pl-2">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          {post.game && (
            <Link
              href={`/game/${post.game.slug}`}
              className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
            >
              {post.game.name}
            </Link>
          )}
        </div>

        {/* Título */}
        <Link href={`/post/${post.id}`} className="block">
          <h3 className="text-base font-semibold text-gray-100 hover:text-indigo-400 transition-colors leading-snug">
            {post.title}
          </h3>
        </Link>

        {/* Metadatos */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          {post.author ? (
            <span className="inline-flex items-center gap-1">
              por{' '}
              <Link href={`/user/${post.author.username}`} className="text-gray-400 hover:text-indigo-400">
                {post.author.username}
              </Link>
              {post.author.id && (
                <UserActionsMenu
                  targetUsername={post.author.username}
                  targetUserId={post.author.id}
                  reportablePostId={post.id}
                />
              )}
            </span>
          ) : (
            <span className="text-gray-600">[eliminado]</span>
          )}
          <span>&middot;</span>
          <span>{timeAgo(post.created_at)}</span>
          <span>&middot;</span>
          <span>{post.comment_count} comentarios</span>
          {post.view_count !== undefined && (
            <>
              <span>&middot;</span>
              <span>{post.view_count} vistas</span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export type { PostCardProps }
