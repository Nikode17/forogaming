import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const userResult = await query<{
    id: string
    username: string
    role: string
    avatar_url: string | null
    bio: string | null
    is_banned: boolean
    created_at: string
  }>(
    `SELECT id, username, role, avatar_url, bio, is_banned, created_at
     FROM users
     WHERE username = $1`,
    [username]
  )

  if (userResult.rowCount === 0) {
    return err('NOT_FOUND', 'Usuario no encontrado', 404)
  }

  const user = userResult.rows[0]

  // Si está baneado, devolver perfil sin posts
  if (user.is_banned) {
    return NextResponse.json({ user, posts: [], post_count: 0 })
  }

  const postsResult = await query<{
    id: string
    title: string
    category: string
    created_at: string
    vote_score: string
    comment_count: string
  }>(
    `SELECT p.id, p.title, p.category, p.created_at,
            COALESCE(SUM(v.value), 0) AS vote_score,
            COUNT(DISTINCT c.id) AS comment_count
     FROM posts p
     LEFT JOIN votes v ON v.target_type = 'post' AND v.target_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id AND c.is_deleted = FALSE
     WHERE p.author_id = $1 AND p.is_deleted = FALSE
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 10`,
    [user.id]
  )

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM posts WHERE author_id = $1 AND is_deleted = FALSE`,
    [user.id]
  )

  return NextResponse.json({
    user,
    posts: postsResult.rows,
    post_count: parseInt(countResult.rows[0].count, 10),
  })
}
