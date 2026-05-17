import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getBlockRelation } from '@/lib/blocks'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const viewerId = request.headers.get('x-user-id')

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

  // Bloqueo (decisión d2):
  //  · si ÉL me bloqueó → 404 simulado (no leak de que me tiene bloqueado)
  //  · si YO le bloqueé → perfil reducido con flag para que el frontend muestre
  //    el badge "Le has bloqueado" + botón desbloquear
  if (viewerId && viewerId !== user.id) {
    const rel = await getBlockRelation(viewerId, user.id)
    if (rel.blockedByThem && !rel.iBlocked) {
      return err('NOT_FOUND', 'Usuario no encontrado', 404)
    }
    if (rel.iBlocked) {
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          role: user.role,
          bio: null,
          is_banned: user.is_banned,
          created_at: user.created_at,
          followers_count: 0,
          following_count: 0,
          friends_count: 0,
        },
        posts: [],
        post_count: 0,
        is_following: false,
        viewer_blocked_them: true,
      })
    }
  }

  // Followers / following counts
  const [followersRes, followingRes] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) AS count FROM follows WHERE following_id = $1', [user.id]),
    query<{ count: string }>('SELECT COUNT(*) AS count FROM follows WHERE follower_id = $1', [user.id]),
  ])
  const followers_count = parseInt(followersRes.rows[0].count, 10)
  const following_count = parseInt(followingRes.rows[0].count, 10)

  // ¿El viewer sigue a este usuario?
  let is_following = false
  if (viewerId && viewerId !== user.id) {
    const f = await query('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [viewerId, user.id])
    is_following = (f.rowCount ?? 0) > 0
  }

  // Número de amigos
  const friendsRes = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM friend_requests
     WHERE (sender_id = $1 OR receiver_id = $1) AND status = 'accepted'`,
    [user.id]
  )
  const friends_count = parseInt(friendsRes.rows[0]?.count ?? '0', 10)

  // Si está baneado, devolver perfil sin posts
  if (user.is_banned) {
    return NextResponse.json({ user: { ...user, followers_count, following_count, friends_count }, posts: [], post_count: 0, is_following })
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
    user: { ...user, followers_count, following_count, friends_count },
    posts: postsResult.rows,
    post_count: parseInt(countResult.rows[0].count, 10),
    is_following,
  })
}
