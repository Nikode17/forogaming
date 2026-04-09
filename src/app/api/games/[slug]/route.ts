import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateGameSchema, formatZodError } from '@/lib/validation'

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
// GET /api/games/:slug
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const gameResult = await query<{
      id: string; name: string; slug: string; cover_url: string | null
      description: string | null; created_at: string
    }>('SELECT id, name, slug, cover_url, description, created_at FROM games WHERE slug = $1', [slug])

    if (gameResult.rows.length === 0) {
      return err('NOT_FOUND', 'Juego no encontrado', 404)
    }

    const game = gameResult.rows[0]

    // Fetch latest 20 posts for this game
    const postsResult = await query<{
      id: string; title: string; category: string; created_at: string
      author_id: string | null; author_username: string | null; author_avatar: string | null
      view_count: number
    }>(`
      SELECT p.id, p.title, p.category, p.created_at, p.author_id, p.view_count,
             u.username  AS author_username,
             u.avatar_url AS author_avatar
      FROM   posts p
      LEFT JOIN users u ON u.id = p.author_id
      WHERE  p.game_id = $1 AND p.is_deleted = FALSE AND p.is_published = TRUE
      ORDER  BY p.created_at DESC
      LIMIT  20
    `, [game.id])

    return NextResponse.json({
      data: {
        ...game,
        posts: postsResult.rows.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          created_at: r.created_at,
          view_count: r.view_count,
          author: r.author_id
            ? { id: r.author_id, username: r.author_username, avatar_url: r.author_avatar }
            : null,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/games/:slug]', error)
    return err('INTERNAL_ERROR', 'Error al obtener el juego', 500)
  }
}

// ---------------------------------------------------------------------------
// PUT /api/games/:slug
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    if (user.role !== 'admin') {
      return err('FORBIDDEN', 'Solo los administradores pueden editar juegos', 403)
    }

    const gameResult = await query<{ id: string; slug: string }>(`
      SELECT id, slug FROM games WHERE slug = $1
    `, [slug])

    if (gameResult.rows.length === 0) {
      return err('NOT_FOUND', 'Juego no encontrado', 404)
    }

    const game = gameResult.rows[0]

    const body = await request.json()
    const parsed = UpdateGameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const data = parsed.data

    // If slug is changing, verify uniqueness
    if (data.slug !== undefined && data.slug !== game.slug) {
      const existing = await query<{ id: string }>('SELECT id FROM games WHERE slug = $1', [data.slug])
      if (existing.rows.length > 0) {
        return err('CONFLICT', 'Ya existe un juego con ese slug', 409)
      }
    }

    // Build dynamic UPDATE
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name) }
    if (data.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(data.slug) }
    if (data.cover_url !== undefined) { fields.push(`cover_url = $${idx++}`); values.push(data.cover_url) }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description) }

    if (fields.length === 0) {
      const result = await query('SELECT * FROM games WHERE id = $1', [game.id])
      return NextResponse.json({ data: result.rows[0] })
    }

    values.push(game.id)
    const result = await query(
      `UPDATE games SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    return NextResponse.json({ data: result.rows[0] })
  } catch (error) {
    console.error('[PUT /api/games/:slug]', error)
    return err('INTERNAL_ERROR', 'Error al actualizar el juego', 500)
  }
}
