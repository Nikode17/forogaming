import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { PaginationSchema, formatZodError } from '@/lib/validation'

type UserRole = 'admin' | 'moderator' | 'user' | 'guest'

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

export async function GET(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role !== 'moderator' && user.role !== 'admin') {
    return err('FORBIDDEN', 'Acceso denegado', 403)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

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

  const [reportsResult, countResult] = await Promise.all([
    query<{
      id: string
      target_type: string
      target_id: string
      reason: string
      status: string
      created_at: string
      reporter_username: string | null
    }>(
      `SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
              u.username AS reporter_username
       FROM reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reports WHERE status = $1`,
      [status]
    ),
  ])

  const total = parseInt(countResult.rows[0].count, 10)

  return NextResponse.json({
    data: reportsResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
}
