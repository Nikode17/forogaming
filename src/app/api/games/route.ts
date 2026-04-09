import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateGameSchema, PaginationSchema, formatZodError } from '@/lib/validation'

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

// ---------------------------------------------------------------------------
// GET /api/games
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = PaginationSchema.safeParse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 100,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Parametros invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const { page, limit } = parsed.data
    const offset = (page - 1) * limit

    const result = await query<{
      id: string; name: string; slug: string; cover_url: string | null
      description: string | null; created_at: string; post_count: string
    }>(`
      SELECT g.id, g.name, g.slug, g.cover_url, g.description, g.created_at,
             COUNT(DISTINCT p.id) AS post_count
      FROM   games g
      LEFT JOIN posts p ON p.game_id = g.id AND p.is_deleted = FALSE AND p.is_published = TRUE
      GROUP  BY g.id
      ORDER  BY g.name ASC
      LIMIT  $1 OFFSET $2
    `, [limit, offset])

    const countResult = await query<{ count: string }>('SELECT COUNT(*) AS count FROM games')
    const total = Number(countResult.rows[0]?.count ?? 0)

    return NextResponse.json({
      data: result.rows.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        cover_url: r.cover_url,
        description: r.description,
        created_at: r.created_at,
        post_count: Number(r.post_count),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/games]', error)
    return err('INTERNAL_ERROR', 'Error al obtener juegos', 500)
  }
}

// ---------------------------------------------------------------------------
// POST /api/games
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    if (user.role !== 'admin') {
      return err('FORBIDDEN', 'Solo los administradores pueden crear juegos', 403)
    }

    const body = await request.json()
    const parsed = CreateGameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Verify slug is unique
    const existing = await query<{ id: string }>('SELECT id FROM games WHERE slug = $1', [data.slug])
    if (existing.rows.length > 0) {
      return err('CONFLICT', 'Ya existe un juego con ese slug', 409)
    }

    const result = await query<{
      id: string; name: string; slug: string; cover_url: string | null
      description: string | null; created_at: string
    }>(`
      INSERT INTO games (id, name, slug, cover_url, description)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *
    `, [data.name, data.slug, data.cover_url ?? null, data.description ?? null])

    return NextResponse.json({ data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/games]', error)
    return err('INTERNAL_ERROR', 'Error al crear juego', 500)
  }
}
