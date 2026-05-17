import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { PaginationSchema, formatZodError } from '@/lib/validation'

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

function snippet(text: string | null | undefined, n = 200): string {
  if (!text) return ''
  return text.length <= n ? text : text.slice(0, n) + '…'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para enriquecer cada reporte con detalles del target. Hace una
// query agrupada por tipo (no N+1) sobre los IDs de la página actual.
// ─────────────────────────────────────────────────────────────────────────────
type TargetDetails =
  | { kind: 'post'; title: string; body_snippet: string }
  | { kind: 'comment'; body_snippet: string; post_id: string; post_title: string }
  | { kind: 'user'; username: string; avatar_url: string | null }
  | { kind: 'message'; body_snippet: string; sender_username: string | null; recipient_username: string | null }
  | { kind: 'missing'; reason: string }

async function loadTargetDetails(reports: { id: string; target_type: TargetType; target_id: string }[]) {
  const idsByType = {
    post: [] as string[],
    comment: [] as string[],
    user: [] as string[],
    message: [] as string[],
  }
  for (const r of reports) idsByType[r.target_type].push(r.target_id)

  const out = new Map<string, TargetDetails>()

  // Posts
  if (idsByType.post.length > 0) {
    const r = await query<{ id: string; title: string; body: string }>(
      `SELECT id, title, body FROM posts WHERE id = ANY($1::uuid[])`,
      [idsByType.post]
    )
    for (const row of r.rows) {
      out.set(row.id, { kind: 'post', title: row.title, body_snippet: snippet(row.body) })
    }
  }

  // Comments
  if (idsByType.comment.length > 0) {
    const r = await query<{ id: string; body: string; post_id: string; post_title: string }>(
      `SELECT c.id, c.body, c.post_id, p.title AS post_title
       FROM comments c LEFT JOIN posts p ON p.id = c.post_id
       WHERE c.id = ANY($1::uuid[])`,
      [idsByType.comment]
    )
    for (const row of r.rows) {
      out.set(row.id, {
        kind: 'comment',
        body_snippet: snippet(row.body),
        post_id: row.post_id,
        post_title: row.post_title,
      })
    }
  }

  // Users
  if (idsByType.user.length > 0) {
    const r = await query<{ id: string; username: string; avatar_url: string | null }>(
      `SELECT id, username, avatar_url FROM users WHERE id = ANY($1::uuid[])`,
      [idsByType.user]
    )
    for (const row of r.rows) {
      out.set(row.id, { kind: 'user', username: row.username, avatar_url: row.avatar_url })
    }
  }

  // Messages
  if (idsByType.message.length > 0) {
    const r = await query<{
      id: string; body: string; sender_username: string | null; recipient_username: string | null
    }>(
      `SELECT dm.id, dm.body,
              us.username AS sender_username,
              ur.username AS recipient_username
       FROM direct_messages dm
       LEFT JOIN users us ON us.id = dm.sender_id
       LEFT JOIN users ur ON ur.id = dm.receiver_id
       WHERE dm.id = ANY($1::uuid[])`,
      [idsByType.message]
    )
    for (const row of r.rows) {
      out.set(row.id, {
        kind: 'message',
        body_snippet: snippet(row.body),
        sender_username: row.sender_username,
        recipient_username: row.recipient_username,
      })
    }
  }

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports?status=pending|resolved|dismissed|all
//                       &targetType=post|comment|user|message|all
//                       &page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role !== 'moderator' && user.role !== 'admin') {
    return err('FORBIDDEN', 'Acceso denegado', 403)
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') ?? 'pending'
  const targetTypeParam = searchParams.get('targetType') ?? 'all'

  const parsed = PaginationSchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }
  const { page, limit } = parsed.data
  const offset = (page - 1) * limit

  // Construcción dinámica del WHERE
  const conditions: string[] = []
  const params: unknown[] = []
  let p = 1
  if (statusParam !== 'all') {
    if (!['pending', 'resolved', 'dismissed'].includes(statusParam)) {
      return err('VALIDATION_ERROR', 'status inválido', 422)
    }
    conditions.push(`r.status = $${p++}`)
    params.push(statusParam)
  }
  if (targetTypeParam !== 'all') {
    if (!['post', 'comment', 'user', 'message'].includes(targetTypeParam)) {
      return err('VALIDATION_ERROR', 'targetType inválido', 422)
    }
    conditions.push(`r.target_type = $${p++}`)
    params.push(targetTypeParam)
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const dataParams = [...params, limit, offset]

  const [reportsResult, countResult] = await Promise.all([
    query<{
      id: string
      target_type: TargetType
      target_id: string
      reason: string | null
      description: string | null
      status: string
      created_at: string
      resolved_at: string | null
      reporter_username: string | null
      resolver_username: string | null
    }>(
      `SELECT r.id, r.target_type, r.target_id, r.reason, r.description, r.status,
              r.created_at, r.resolved_at,
              u.username  AS reporter_username,
              ru.username AS resolver_username
       FROM reports r
       LEFT JOIN users u  ON u.id  = r.reporter_id
       LEFT JOIN users ru ON ru.id = r.resolved_by
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      dataParams
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reports r ${whereClause}`,
      params
    ),
  ])

  const reports = reportsResult.rows
  const details = await loadTargetDetails(reports)

  const total = parseInt(countResult.rows[0].count, 10)

  return NextResponse.json({
    data: reports.map((r) => ({
      id: r.id,
      target_type: r.target_type,
      target_id: r.target_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      reporter: r.reporter_username ? { username: r.reporter_username } : null,
      resolver: r.resolver_username ? { username: r.resolver_username } : null,
      target_details: details.get(r.target_id) ?? { kind: 'missing', reason: 'Target no encontrado' },
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
}
