import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  const username = req.headers.get('x-user-username')
  if (!id || !username) return null
  return { id, username }
}

// GET /api/messages  →  lista de conversaciones (último mensaje con cada usuario)
export async function GET(req: NextRequest) {
  const me = getUser(req)
  if (!me) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const result = await query<{
    other_id: string
    other_username: string
    other_avatar: string | null
    other_last_seen: string | null
    last_body: string
    last_at: string
    unread: string
  }>(`
    SELECT
      u.id            AS other_id,
      u.username      AS other_username,
      u.avatar_url    AS other_avatar,
      u.last_seen     AS other_last_seen,
      last_msg.body   AS last_body,
      last_msg.created_at AS last_at,
      COUNT(dm.id) FILTER (WHERE dm.read_at IS NULL AND dm.receiver_id = $1) AS unread
    FROM (
      SELECT DISTINCT
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id
      FROM direct_messages
      WHERE sender_id = $1 OR receiver_id = $1
    ) convs
    JOIN users u ON u.id = convs.other_id
    JOIN LATERAL (
      SELECT body, created_at FROM direct_messages
      WHERE (sender_id = $1 AND receiver_id = convs.other_id)
         OR (sender_id = convs.other_id AND receiver_id = $1)
      ORDER BY created_at DESC LIMIT 1
    ) last_msg ON TRUE
    LEFT JOIN direct_messages dm
      ON (dm.sender_id = $1 AND dm.receiver_id = convs.other_id)
      OR (dm.sender_id = convs.other_id AND dm.receiver_id = $1)
    GROUP BY u.id, u.username, u.avatar_url, u.last_seen, last_msg.body, last_msg.created_at
    ORDER BY last_msg.created_at DESC
  `, [me.id])

  return NextResponse.json({ data: result.rows })
}
