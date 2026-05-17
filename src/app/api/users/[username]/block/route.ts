import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'

function getMe(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return null
  return { id }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

async function resolveTarget(username: string): Promise<{ id: string } | null> {
  const r = await query<{ id: string }>(
    'SELECT id FROM users WHERE username = $1',
    [username]
  )
  return r.rows[0] ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/:username/block — bloquear a un usuario
// Idempotente: si ya estaba bloqueado, responde 200 sin error.
// Efecto colateral: borra cualquier amistad/solicitud entre ambos.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = getMe(req)
    if (!me) return err('UNAUTHORIZED', 'Autenticación requerida', 401)

    const { username } = await params
    const target = await resolveTarget(username)
    if (!target) return err('NOT_FOUND', 'Usuario no encontrado', 404)

    if (target.id === me.id) {
      return err('BAD_REQUEST', 'No puedes bloquearte a ti mismo', 400)
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO user_blocks (blocker_id, blocked_id)
         VALUES ($1, $2)
         ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
        [me.id, target.id]
      )
      await client.query(
        `DELETE FROM friend_requests
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)`,
        [me.id, target.id]
      )
    })

    return NextResponse.json({ blocked: true }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/users/:username/block]', error)
    return err('INTERNAL_ERROR', 'Error al bloquear', 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/:username/block — desbloquear
// Idempotente: si no había bloqueo, responde 200 con removed=false.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = getMe(req)
    if (!me) return err('UNAUTHORIZED', 'Autenticación requerida', 401)

    const { username } = await params
    const target = await resolveTarget(username)
    if (!target) return err('NOT_FOUND', 'Usuario no encontrado', 404)

    const result = await query(
      `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [me.id, target.id]
    )

    return NextResponse.json({ removed: (result.rowCount ?? 0) > 0 })
  } catch (error) {
    console.error('[DELETE /api/users/:username/block]', error)
    return err('INTERNAL_ERROR', 'Error al desbloquear', 500)
  }
}
