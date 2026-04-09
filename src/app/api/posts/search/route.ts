import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SearchQuerySchema, formatZodError } from '@/lib/validation'

// TODO: Optimizar con indice GIN (to_tsvector) para produccion cuando el volumen de posts sea alto

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = SearchQuerySchema.safeParse({
      q: searchParams.get('q'),
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Parametros invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }
    const { q, page, limit } = parsed.data
    const offset = (page - 1) * limit
    const pattern = `%${q}%`

    const [dataResult, countResult] = await Promise.all([
      query<{
        id: string; title: string; category: string; created_at: string
        author_username: string | null; game_name: string | null; game_slug: string | null
      }>(`
        SELECT p.id, p.title, p.category, p.created_at,
               u.username AS author_username,
               g.name     AS game_name,
               g.slug     AS game_slug
        FROM   posts p
        LEFT JOIN users u ON u.id = p.author_id
        LEFT JOIN games g ON g.id = p.game_id
        WHERE  p.is_deleted = FALSE AND p.is_published = TRUE
          AND  (p.title ILIKE $1 OR p.body ILIKE $1)
        ORDER  BY p.created_at DESC
        LIMIT  $2 OFFSET $3
      `, [pattern, limit, offset]),
      query<{ count: string }>(`
        SELECT COUNT(*) AS count FROM posts
        WHERE  is_deleted = FALSE AND is_published = TRUE
          AND  (title ILIKE $1 OR body ILIKE $1)
      `, [pattern]),
    ])

    const total = Number(countResult.rows[0]?.count ?? 0)
    return NextResponse.json({
      data: dataResult.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        created_at: r.created_at,
        author: r.author_username ? { username: r.author_username } : null,
        game: r.game_name ? { name: r.game_name, slug: r.game_slug } : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/posts/search]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error en la busqueda' } },
      { status: 500 }
    )
  }
}
