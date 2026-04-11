import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query<{ post_count: string; user_count: string; game_count: string }>(`
      SELECT
        (SELECT COUNT(*) FROM posts   WHERE is_deleted = FALSE AND is_published = TRUE) AS post_count,
        (SELECT COUNT(*) FROM users   WHERE is_banned  = FALSE)                         AS user_count,
        (SELECT COUNT(*) FROM games)                                                     AS game_count
    `)
    const row = result.rows[0]
    return NextResponse.json({
      post_count: Number(row.post_count),
      user_count: Number(row.user_count),
      game_count: Number(row.game_count),
    })
  } catch {
    return NextResponse.json({ post_count: 0, user_count: 0, game_count: 0 })
  }
}
