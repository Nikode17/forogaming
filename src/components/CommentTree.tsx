'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoteButtons from '@/components/VoteButtons'
import CommentForm from '@/components/CommentForm'
import UserActionsMenu from '@/components/UserActionsMenu'

interface CommentNode {
  id: string
  author: { id?: string; username: string; avatar_url: string | null } | null
  parent_id: string | null
  body: string
  is_deleted: boolean
  created_at: string
  upvotes: number
  downvotes: number
  replies: CommentNode[]
}

interface CommentTreeProps {
  comments: CommentNode[]
  postId: string
  depth?: number
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} días`
}

const MAX_VISUAL_DEPTH = 4

function CommentItem({ comment, postId, depth }: { comment: CommentNode; postId: string; depth: number }) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  const indent = depth < MAX_VISUAL_DEPTH ? depth : MAX_VISUAL_DEPTH

  return (
    <div
      className={indent > 0 ? 'ml-6 border-l border-gray-700 pl-4' : ''}
    >
      <div className="py-3">
        {comment.is_deleted ? (
          <p className="text-sm text-gray-600 italic">[comentario eliminado]</p>
        ) : (
          <>
            {/* Cabecera: avatar + username + fecha */}
            <div className="flex items-center gap-2 mb-1">
              {comment.author ? (
                <>
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Link
                    href={`/user/${comment.author.username}`}
                    className="text-sm font-medium text-gray-300 hover:text-indigo-400"
                  >
                    {comment.author.username}
                  </Link>
                  {comment.author.id && (
                    <UserActionsMenu
                      targetUsername={comment.author.username}
                      targetUserId={comment.author.id}
                      reportableCommentId={comment.id}
                    />
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-600">[eliminado]</span>
              )}
              <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
            </div>

            {/* Body (HTML sanitizado del servidor) */}
            <div
              className="text-sm text-gray-200 prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.body }}
            />

            {/* Acciones: votos + responder */}
            <div className="flex items-center gap-4 mt-2">
              <VoteButtons
                targetType="comment"
                targetId={comment.id}
                initialUpvotes={comment.upvotes}
                initialDownvotes={comment.downvotes}
                vertical={false}
              />
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
              >
                Responder
              </button>
            </div>

            {/* Formulario de respuesta inline */}
            {showReplyForm && (
              <div className="mt-2">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  onSuccess={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Respuestas recursivas */}
      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentTree({ comments, postId, depth = 0 }: CommentTreeProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No hay comentarios todavía. ¡Sé el primero en comentar!
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          depth={depth}
        />
      ))}
    </div>
  )
}

export type { CommentNode, CommentTreeProps }
