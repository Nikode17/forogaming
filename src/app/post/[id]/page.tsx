import { notFound } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import VoteButtons from '@/components/VoteButtons'
import CommentTree from '@/components/CommentTree'
import CommentForm from '@/components/CommentForm'
import type { CommentNode } from '@/components/CommentTree'

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

interface PostData {
  id: string
  title: string
  body: string
  category: string
  author: { username: string; avatar_url: string | null } | null
  game: { name: string; slug: string } | null
  upvotes: number
  downvotes: number
  comment_count: number
  view_count: number
  created_at: string
}

interface MediaItem {
  id: string
  media_type: string
  url: string
  alt_text: string | null
  position: number
}

interface StepItem {
  step_num: number
  title: string
  body: string
  image_url: string | null
}

interface GameItem {
  id: string
  name: string
  slug: string
  cover_url: string | null
  post_count: number
}

const categoryStyles: Record<string, { bg: string; label: string }> = {
  guide: { bg: 'bg-blue-900 text-blue-300', label: 'Guia' },
  'easter-egg': { bg: 'bg-yellow-900 text-yellow-300', label: 'Easter Egg' },
  review: { bg: 'bg-green-900 text-green-300', label: 'Review' },
  general: { bg: 'bg-gray-700 text-gray-300', label: 'General' },
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} dias`
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await apiFetch<{ post: { title: string; body: string } }>(`/api/posts/${id}`)
  if (!data) return { title: 'Post no encontrado — Respawn' }
  return {
    title: `${data.post.title} — Respawn`,
    description: data.post.body.replace(/<[^>]*>/g, '').slice(0, 160),
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [postData, commentsData, gamesData] = await Promise.all([
    apiFetch<{ post: PostData; media: MediaItem[]; steps: StepItem[] }>(`/api/posts/${id}`),
    apiFetch<{ data: CommentNode[] }>(`/api/posts/${id}/comments`),
    apiFetch<{ data: GameItem[] }>('/api/games'),
  ])

  if (!postData) notFound()

  const { post, media, steps } = postData
  const comments = commentsData?.data ?? []
  const games = gamesData?.data ?? []

  const style = categoryStyles[post.category] ?? categoryStyles.general
  const images = media.filter((m) => m.media_type === 'image')
  const videoEmbeds = media.filter((m) => m.media_type === 'video_embed')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar games={games} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-indigo-400 transition-colors">
            Inicio
          </Link>
          <span>/</span>
          {post.game && (
            <>
              <Link
                href={`/game/${post.game.slug}`}
                className="hover:text-indigo-400 transition-colors"
              >
                {post.game.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-400 truncate">{post.title}</span>
        </nav>

        {/* Post card */}
        <article className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${style.bg}`}>
              {style.label}
            </span>
            {post.game && (
              <Link
                href={`/game/${post.game.slug}`}
                className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
              >
                {post.game.name}
              </Link>
            )}
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{post.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            {post.author ? (
              <span>
                por{' '}
                <Link
                  href={`/user/${post.author.username}`}
                  className="text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  @{post.author.username}
                </Link>
              </span>
            ) : (
              <span className="text-gray-600">[eliminado]</span>
            )}
            <span>&middot;</span>
            <span>{timeAgo(post.created_at)}</span>
            <span>&middot;</span>
            <span>{post.view_count} vistas</span>
          </div>

          {/* Votos */}
          <div className="mb-6">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              initialUpvotes={post.upvotes}
              initialDownvotes={post.downvotes}
              vertical={false}
            />
          </div>

          {/* Imagenes */}
          {images.length > 0 && (
            <div className="mb-6 space-y-4">
              {images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  className="w-full rounded-lg max-h-[600px] object-contain bg-gray-950"
                />
              ))}
            </div>
          )}

          {/* Body */}
          <div
            className="prose prose-invert prose-lg max-w-none mb-6 text-gray-200"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* Steps (solo para guias) */}
          {post.category === 'guide' && steps.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-200 mb-4">Pasos de la guia</h2>
              <ol className="space-y-4">
                {steps
                  .sort((a, b) => a.step_num - b.step_num)
                  .map((step) => (
                    <li
                      key={step.step_num}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {step.step_num}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-100 mb-1">
                            {step.title}
                          </h3>
                          <div
                            className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: step.body }}
                          />
                          {step.image_url && (
                            <img
                              src={step.image_url}
                              alt={`Paso ${step.step_num}`}
                              className="mt-3 rounded-lg max-h-96 object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {/* Video embeds */}
          {videoEmbeds.length > 0 && (
            <div className="mb-6 space-y-4">
              {videoEmbeds.map((vid) => (
                <iframe
                  key={vid.id}
                  src={vid.url}
                  className="w-full aspect-video rounded-lg"
                  allowFullScreen
                  title="Video embed"
                />
              ))}
            </div>
          )}
        </article>

        {/* Comentarios */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-100">
              Comentarios ({post.comment_count})
            </h2>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="mb-6">
            <CommentForm postId={post.id} />
          </div>

          <CommentTree comments={comments} postId={post.id} />
        </section>
      </main>
    </div>
  )
}
