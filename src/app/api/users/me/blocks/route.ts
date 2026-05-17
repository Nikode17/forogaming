import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function getMe(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return null
  return { id }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me/blocks — lista paginada de usuarios bloqueados POR mí
// Query params: ?page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const me = getMe(req)
    if (!me) return err('UNAUTHORIZED', 'Autenticación requerida', 401)

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10) || 20))
    const offset = (page - 1) * limit

    const [countRes, dataRes] = await Promise.all([
      query<{ total: string }>(
        'SELECT COUNT(*) AS total FROM user_blocks WHERE blocker_id = $1',
        [me.id]
      ),
      query<{
        id: string
        blocked_at: string
        user_id: string
        username: string
        avatar_url: string | null
      }>(`
        SELECT ub.id, ub.created_at AS blocked_at,
               u.id AS user_id, u.username, u.avatar_url
        FROM user_blocks ub
        JOIN users u ON u.id = ub.blocked_id
        WHERE ub.blocker_id = $1
        ORDER BY ub.created_at DESC
        LIMIT $2 OFFSET $3
      `, [me.id, limit, offset]),
    ])

    const total = parseInt(countRes.rows[0]?.total ?? '0', 10)

    return NextResponse.json({
      data: dataRes.rows.map((r) => ({
        block_id: r.id,
        blocked_at: r.blocked_at,
        user: { id: r.user_id, username: r.username, avatar_url: r.avatar_url },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/users/me/blocks]', error)
    return err('INTERNAL_ERROR', 'Error al listar bloqueados', 500)
  }
}
