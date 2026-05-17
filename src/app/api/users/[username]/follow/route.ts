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

// GET /api/users/[username]/follow  → estado de seguimiento
// Si hay bloqueo, devuelve following:false (no leak).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = getUser(req)
  if (!me) return NextResponse.json({ following: false })

  const { username } = await params
  const target = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1', [username]
  )
  if (!target.rows[0]) return NextResponse.json({ following: false })

  const rel = await getBlockRelation(me.id, target.rows[0].id)
  if (hasAnyBlock(rel)) return NextResponse.json({ following: false })

  const f = await query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [me.id, target.rows[0].id]
  )
  return NextResponse.json({ following: (f.rowCount ?? 0) > 0 })
}

// POST /api/users/[username]/follow  → seguir
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  const { username } = await params

  if (me.username.toLowerCase() === username.toLowerCase())
    return err('BAD_REQUEST', 'No puedes seguirte a ti mismo', 400)

  const target = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1', [username]
  )
  if (!target.rows[0]) return err('NOT_FOUND', 'Usuario no encontrado', 404)

  // 403 si hay bloqueo en cualquier dirección
  const rel = await getBlockRelation(me.id, target.rows[0].id)
  if (hasAnyBlock(rel)) return err('FORBIDDEN', 'No puedes seguir a este usuario', 403)

  await query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [me.id, target.rows[0].id]
  )

  return NextResponse.json({ following: true })
}

// DELETE /api/users/[username]/follow  → dejar de seguir
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = getUser(req)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)

  const { username } = await params

  const target = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1', [username]
  )
  if (!target.rows[0]) return err('NOT_FOUND', 'Usuario no encontrado', 404)

  await query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [me.id, target.rows[0].id]
  )

  return NextResponse.json({ following: false })
}
