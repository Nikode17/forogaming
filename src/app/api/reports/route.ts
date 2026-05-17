import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateReportSchema, formatZodError } from '@/lib/validation'
import { rateLimitReport, rateLimitHeaders } from '@/lib/ratelimit'

type UserRole = 'admin' | 'moderator' | 'user' | 'guest'

function getRequestUser(request: NextRequest) {
  const id = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') as UserRole | null
  const username = request.headers.get('x-user-username')
  if (!id || !role || !username) return null
  return { id, role, username }
}

function err(code: string, message: string, status: number, extra?: object) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status })
}

/**
 * Resuelve el author_id (post/comment) o sender_id (message) del target para
 * detectar auto-reportes. Devuelve null si el target no existe.
 *
 * Para 'message' devuelve también recipient_id porque solo el receptor puede
 * reportar un DM (el sender no puede reportarse a sí mismo y un tercero no
 * participa en la conversación).
 */
async function resolveTargetOwner(
  target_type: 'post' | 'comment' | 'user' | 'message',
  target_id: string
): Promise<{ ownerId: string | null; recipientId?: string } | null> {
  switch (target_type) {
    case 'post': {
      const r = await query<{ author_id: string | null }>(
        'SELECT author_id FROM posts WHERE id = $1 AND is_deleted = FALSE',
        [target_id]
      )
      if (r.rows.length === 0) return null
      return { ownerId: r.rows[0].author_id }
    }
    case 'comment': {
      const r = await query<{ author_id: string | null }>(
        'SELECT author_id FROM comments WHERE id = $1 AND is_deleted = FALSE',
        [target_id]
      )
      if (r.rows.length === 0) return null
      return { ownerId: r.rows[0].author_id }
    }
    case 'user': {
      const r = await query<{ id: string }>('SELECT id FROM users WHERE id = $1', [target_id])
      if (r.rows.length === 0) return null
      return { ownerId: r.rows[0].id }
    }
    case 'message': {
      const r = await query<{ sender_id: string; receiver_id: string }>(
        'SELECT sender_id, receiver_id FROM direct_messages WHERE id = $1',
        [target_id]
      )
      if (r.rows.length === 0) return null
      return { ownerId: r.rows[0].sender_id, recipientId: r.rows[0].receiver_id }
    }
  }
}

export async function POST(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role === 'guest') return err('FORBIDDEN', 'Acceso denegado', 403)

  // Rate limit por usuario (20/hora)
  const rl = await rateLimitReport(user.id)
  if (!rl.success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Has excedido el límite de reportes por hora' } },
      { status: 429, headers: rateLimitHeaders(rl, 20) }
    )
  }

  let body: unknown
  try { body = await request.json() } catch { return err('VALIDATION_ERROR', 'Body inválido', 422) }

  const parsed = CreateReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  const { target_type, target_id, reason, description } = parsed.data

  // Resolver autor del target para detectar auto-reportes y validar permisos en mensajes
  const owner = await resolveTargetOwner(target_type, target_id)
  if (!owner) return err('NOT_FOUND', `${target_type} no encontrado`, 404)

  if (owner.ownerId === user.id) {
    return err('BAD_REQUEST', 'No puedes reportar tu propio contenido', 400)
  }

  // Reglas extra para mensajes privados: solo el receptor puede reportar
  if (target_type === 'message' && owner.recipientId !== user.id) {
    return err('FORBIDDEN', 'Solo el destinatario puede reportar un mensaje', 403)
  }

  // Ventana anti-spam de 24h: no reportar el mismo target dos veces en 24h
  const duplicateCheck = await query(
    `SELECT id FROM reports
     WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3
       AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [user.id, target_type, target_id]
  )
  if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
    return err('CONFLICT', 'Ya has reportado este contenido en las últimas 24 horas', 409)
  }

  const result = await query<{ id: string; status: string }>(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, description, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id, status`,
    [user.id, target_type, target_id, reason, description ?? null]
  )

  return NextResponse.json(
    { message: 'Reporte enviado', report: result.rows[0] },
    { status: 201 }
  )
}
