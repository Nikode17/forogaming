import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getBlockRelation, hasAnyBlock } from '@/lib/blocks'

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  const username = req.headers.get('x-user-username')
  if (!id || !username) return null
  return { id, username }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// POST /api/friends/request  →  enviar solicitud de amistad
// Body: { username: string }
export async function POST(req: NextRequest) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  let body: { username?: string }
  try { body = await req.json() } catch { return err('VALIDATION_ERROR', 'Body inválido', 422) }

  const targetUsername = body.username?.trim()
  if (!targetUsername) return err('VALIDATION_ERROR', 'Falta el username', 422)

  if (me.username.toLowerCase() === targetUsername.toLowerCase())
    return err('BAD_REQUEST', 'No puedes enviarte una solicitud a ti mismo', 400)

  const target = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1 AND is_banned = FALSE', [targetUsername]
  )
  if (!target.rows[0]) return err('NOT_FOUND', 'Usuario no encontrado', 404)

  const targetId = target.rows[0].id

  // 403 si hay bloqueo en cualquier dirección
  const rel = await getBlockRelation(me.id, targetId)
  if (hasAnyBlock(rel)) return err('FORBIDDEN', 'No puedes enviar solicitud a este usuario', 403)

  // Comprobar si ya existe relación en cualquier dirección
  const existing = await query<{ status: string; sender_id: string }>(
    `SELECT status, sender_id FROM friend_requests
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)`,
    [me.id, targetId]
  )

  if (existing.rows[0]) {
    const { status, sender_id } = existing.rows[0]
    if (status === 'accepted') return err('ALREADY_FRIENDS', 'Ya sois amigos', 409)
    if (status === 'pending' && sender_id === me.id)
      return err('ALREADY_SENT', 'Ya enviaste una solicitud', 409)
    if (status === 'pending' && sender_id === targetId) {
      // El otro ya te envió solicitud — aceptar automáticamente
      await query(
        `UPDATE friend_requests SET status = 'accepted'
         WHERE sender_id = $1 AND receiver_id = $2`,
        [targetId, me.id]
      )
      return NextResponse.json({ status: 'accepted' })
    }
    // Rechazada previamente — reenviar
    await query(
      `UPDATE friend_requests SET status = 'pending', created_at = NOW()
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)`,
      [me.id, targetId]
    )
    return NextResponse.json({ status: 'pending' })
  }

  await query(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)',
    [me.id, targetId]
  )

  return NextResponse.json({ status: 'pending' }, { status: 201 })
}
