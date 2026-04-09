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

  const { searchParams } = new URL(request.url)
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

  const [favoritesResult, countResult] = await Promise.all([
    query<{
      id: string
      title: string
      category: string
      created_at: string
      author_username: string | null
      game_name: string | null
      game_slug: string | null
      favorited_at: string
    }>(
      `SELECT p.id, p.title, p.category, p.created_at,
              u.username AS author_username,
              g.name AS game_name, g.slug AS game_slug,
              f.created_at AS favorited_at
       FROM favorites f
       JOIN posts p ON p.id = f.post_id AND p.is_deleted = FALSE
       LEFT JOIN users u ON u.id = p.author_id
       LEFT JOIN games g ON g.id = p.game_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM favorites f
       JOIN posts p ON p.id = f.post_id AND p.is_deleted = FALSE
       WHERE f.user_id = $1`,
      [user.id]
    ),
  ])

  const total = parseInt(countResult.rows[0].count, 10)

  return NextResponse.json({
    data: favoritesResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
}
