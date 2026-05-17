import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { ResolveReportSchema, formatZodError } from '@/lib/validation'

type UserRole = 'admin' | 'moderator' | 'user' | 'guest'
type TargetType = 'post' | 'comment' | 'user' | 'message'

function getRequestUser(request: NextRequest) {
  const id = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') as UserRole | null
  const username = request.headers.get('x-user-username')
  if (!id || !role || !username) return null
  return { id, role, username }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/reports/:id/resolve
// Body: { action: 'dismiss' | 'remove_content' | 'ban_user' }
//
//  · dismiss          → status='dismissed', sin tocar el target
//  · remove_content   → soft-delete del target (hard delete en messages) + status='resolved'
//  · ban_user         → is_banned=TRUE en el dueño del target + status='resolved'
//
// Todo en transacción para garantizar atomicidad.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = getRequestUser(request)
  if (!me) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (me.role !== 'moderator' && me.role !== 'admin') {
    return err('FORBIDDEN', 'Acceso denegado', 403)
  }

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch { return err('VALIDATION_ERROR', 'Body inválido', 422) }

  const parsed = ResolveReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }
  const { action } = parsed.data

  // Cargar reporte para conocer target_type/target_id
  const reportRes = await query<{ target_type: TargetType; target_id: string; status: string }>(
    'SELECT target_type, target_id, status FROM reports WHERE id = $1',
    [id]
  )
  if (reportRes.rows.length === 0) return err('NOT_FOUND', 'Reporte no encontrado', 404)
  const report = reportRes.rows[0]

  if (report.status !== 'pending') {
    return err('CONFLICT', 'El reporte ya está resuelto', 409)
  }

  try {
    const updated = await withTransaction(async (client) => {
      // 1. Aplicar la acción sobre el target (si procede)
      if (action === 'remove_content') {
        switch (report.target_type) {
          case 'post':
            await client.query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [report.target_id])
            break
          case 'comment':
            await client.query('UPDATE comments SET is_deleted = TRUE WHERE id = $1', [report.target_id])
            break
          case 'message':
            await client.query('DELETE FROM direct_messages WHERE id = $1', [report.target_id])
            break
          case 'user':
            throw new Error('BAD_REQUEST: remove_content no aplica a usuarios; usa ban_user')
        }
      } else if (action === 'ban_user') {
        // Resolver dueño del target a banear
        let ownerId: string | null = null
        switch (report.target_type) {
          case 'post': {
            const r = await client.query<{ author_id: string | null }>(
              'SELECT author_id FROM posts WHERE id = $1', [report.target_id])
            ownerId = r.rows[0]?.author_id ?? null
            break
          }
          case 'comment': {
            const r = await client.query<{ author_id: string | null }>(
              'SELECT author_id FROM comments WHERE id = $1', [report.target_id])
            ownerId = r.rows[0]?.author_id ?? null
            break
          }
          case 'user':
            ownerId = report.target_id
            break
          case 'message': {
            const r = await client.query<{ sender_id: string }>(
              'SELECT sender_id FROM direct_messages WHERE id = $1', [report.target_id])
            ownerId = r.rows[0]?.sender_id ?? null
            break
          }
        }
        if (!ownerId) throw new Error('NOT_FOUND: no se pudo resolver el usuario a banear')
        await client.query('UPDATE users SET is_banned = TRUE WHERE id = $1', [ownerId])
      }
      // (action === 'dismiss': no se toca el target)

      // 2. Marcar el reporte
      const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved'
      const r = await client.query<{
        id: string; target_type: TargetType; target_id: string; status: string
        resolved_at: string; resolved_by: string
      }>(
        `UPDATE reports
         SET status = $1, resolved_at = NOW(), resolved_by = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING id, target_type, target_id, status, resolved_at, resolved_by`,
        [newStatus, me.id, id]
      )
      return r.rows[0]
    })

    return NextResponse.json({ report: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    if (msg.startsWith('BAD_REQUEST:')) return err('BAD_REQUEST', msg.slice(13).trim(), 400)
    if (msg.startsWith('NOT_FOUND:')) return err('NOT_FOUND', msg.slice(10).trim(), 404)
    console.error('[POST /api/admin/reports/:id/resolve]', e)
    return err('INTERNAL_ERROR', 'Error al resolver el reporte', 500)
  }
}
