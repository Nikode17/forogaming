import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { excludeBlockedSql } from '@/lib/blocks'

// GET /api/friends/pending  →  número de solicitudes pendientes (para badge)
// Excluye solicitudes de usuarios con los que hay bloqueo.
export async function GET(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return NextResponse.json({ count: 0 })

  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM friend_requests
     WHERE receiver_id = $1
       AND status = 'pending'
       AND ${excludeBlockedSql('sender_id', '$1')}`,
    [id]
  )

  return NextResponse.json({ count: Number(result.rows[0]?.count ?? 0) })
}
