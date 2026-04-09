import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query<{
      id: string; title: string; category: string; game_id: string | null
      author_id: string | null; upvotes: string; downvotes: string
      net_votes: string; trending_score: string; author_username: string | null
      author_avatar: string | null; game_name: string | null; game_slug: string | null
      comment_count: string
    }>(`
      SELECT
        ps.id, ps.title, ps.category, ps.game_id, ps.author_id,
        ps.upvotes, ps.downvotes, ps.net_votes, ps.trending_score,
        u.username  AS author_username,
        u.avatar_url AS author_avatar,
        g.name      AS game_name,
        g.slug      AS game_slug,
        COUNT(DISTINCT c.id) AS comment_count
      FROM post_scores ps
      LEFT JOIN users    u ON u.id = ps.author_id
      LEFT JOIN games    g ON g.id = ps.game_id
      LEFT JOIN comments c ON c.post_id = ps.id AND c.is_deleted = FALSE
      GROUP BY ps.id, ps.title, ps.category, ps.game_id, ps.author_id,
               ps.upvotes, ps.downvotes, ps.net_votes, ps.trending_score,
               u.username, u.avatar_url, g.name, g.slug
      ORDER BY ps.trending_score DESC
      LIMIT 10
    `)

    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      author: row.author_id
        ? { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar }
        : null,
      game: row.game_id
        ? { id: row.game_id, name: row.game_name, slug: row.game_slug }
        : null,
      upvotes: Number(row.upvotes),
      downvotes: Number(row.downvotes),
      net_votes: Number(row.net_votes),
      trending_score: Number(row.trending_score),
      comment_count: Number(row.comment_count),
    }))

    return NextResponse.json({ data: posts })
  } catch (error) {
    console.error('[GET /api/posts/trending]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error al obtener trending' } },
      { status: 500 }
    )
  }
}
