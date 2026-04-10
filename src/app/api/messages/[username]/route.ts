import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function getUser(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  const username = req.headers.get('x-user-username')
  if (!id || !username) return null
  return { id, username }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// GET /api/messages/[username]  →  mensajes con ese usuario (+ marca como leídos)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  const { username } = await params
  const since = req.nextUrl.searchParams.get('since') // ISO string para polling

  const other = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1', [username]
  )
  if (!other.rows[0]) return err('NOT_FOUND', 'Usuario no encontrado', 404)

  const otherId = other.rows[0].id

  // Marcar como leídos los mensajes recibidos
  await query(
    `UPDATE direct_messages SET read_at = NOW()
     WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL`,
    [me.id, otherId]
  )

  const sinceClause = since ? 'AND dm.created_at > $3' : ''
  const sinceParam = since ? [me.id, otherId, since] : [me.id, otherId]

  const messages = await query<{
    id: string
    sender_id: string
    body: string
    created_at: string
    read_at: string | null
  }>(`
    SELECT id, sender_id, body, created_at, read_at
    FROM direct_messages dm
    WHERE ((sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1))
    ${sinceClause}
    ORDER BY created_at ASC
    LIMIT 100
  `, sinceParam)

  return NextResponse.json({ data: messages.rows })
}

// POST /api/messages/[username]  →  enviar mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  const { username } = await params

  if (me.username.toLowerCase() === username.toLowerCase())
    return err('BAD_REQUEST', 'No puedes enviarte mensajes a ti mismo', 400)

  const other = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1', [username]
  )
  if (!other.rows[0]) return err('NOT_FOUND', 'Usuario no encontrado', 404)

  let body: { body?: string }
  try { body = await req.json() } catch { return err('VALIDATION_ERROR', 'Body inválido', 422) }

  const text = body?.body?.trim() ?? ''
  if (!text) return err('VALIDATION_ERROR', 'El mensaje no puede estar vacío', 422)
  if (text.length > 2000) return err('VALIDATION_ERROR', 'Mensaje demasiado largo', 422)

  const result = await query<{ id: string; created_at: string }>(
    `INSERT INTO direct_messages (sender_id, receiver_id, body)
     VALUES ($1, $2, $3) RETURNING id, created_at`,
    [me.id, other.rows[0].id, text]
  )

  return NextResponse.json({ data: result.rows[0] }, { status: 201 })
}
