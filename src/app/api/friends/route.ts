import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return null
  return { id }
}

// GET /api/friends  →  lista de amigos aceptados + solicitudes pendientes recibidas
export async function GET(req: NextRequest) {
  const me = getUser(req)
  if (!me) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const [friends, pending] = await Promise.all([
    // Amigos aceptados (en cualquier dirección)
    query<{ id: string; username: string; avatar_url: string | null }>(`
      SELECT u.id, u.username, u.avatar_url
      FROM friend_requests fr
      JOIN users u ON u.id = CASE
        WHEN fr.sender_id = $1 THEN fr.receiver_id
        ELSE fr.sender_id
      END
      WHERE (fr.sender_id = $1 OR fr.receiver_id = $1)
        AND fr.status = 'accepted'
      ORDER BY u.username ASC
    `, [me.id]),

    // Solicitudes pendientes recibidas
    query<{ id: string; sender_id: string; username: string; avatar_url: string | null; created_at: string }>(`
      SELECT fr.id, fr.sender_id, u.username, u.avatar_url, fr.created_at
      FROM friend_requests fr
      JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [me.id]),
  ])

  return NextResponse.json({
    friends: friends.rows,
    pending: pending.rows,
  })
}
