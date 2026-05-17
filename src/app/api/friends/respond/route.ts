import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getBlockRelation, hasAnyBlock } from '@/lib/blocks'

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return null
  return { id }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// POST /api/friends/respond
// Body: { request_id: string, action: 'accept' | 'reject' }
export async function POST(req: NextRequest) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  let body: { request_id?: string; action?: string }
  try { body = await req.json() } catch { return err('VALIDATION_ERROR', 'Body inválido', 422) }

  const { request_id, action } = body
  if (!request_id || !['accept', 'reject'].includes(action ?? ''))
    return err('VALIDATION_ERROR', 'request_id y action requeridos', 422)

  // Carga la solicitud para conocer el sender y aplicar el check de bloqueo
  const reqRow = await query<{ sender_id: string }>(
    `SELECT sender_id FROM friend_requests
     WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
    [request_id, me.id]
  )
  if (reqRow.rows.length === 0) return err('NOT_FOUND', 'Solicitud no encontrada', 404)

  const rel = await getBlockRelation(me.id, reqRow.rows[0].sender_id)
  if (hasAnyBlock(rel)) return err('FORBIDDEN', 'No puedes responder a este usuario', 403)

  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  const result = await query(
    `UPDATE friend_requests SET status = $1
     WHERE id = $2 AND receiver_id = $3 AND status = 'pending'`,
    [newStatus, request_id, me.id]
  )

  if ((result.rowCount ?? 0) === 0)
    return err('NOT_FOUND', 'Solicitud no encontrada', 404)

  return NextResponse.json({ status: newStatus })
}
