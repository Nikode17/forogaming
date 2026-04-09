import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { PostsQuerySchema, CreatePostSchema, formatZodError } from '@/lib/validation'
import { sanitizePostBody, isAllowedEmbedUrl, isValidImageUrl } from '@/lib/sanitize'
import { rateLimitPostCreate, rateLimitHeaders } from '@/lib/ratelimit'
import type { UserRole } from '@/types'

function getRequestUser(request: NextRequest) {
  const id = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') as UserRole | null
  const username = request.headers.get('x-user-username')
  if (!id || !role || !username) return null
  return { id, role, username }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const rawParams = {
      game: url.searchParams.get('game') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    }

    const parsed = PostsQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Parámetros de consulta inválidos', details: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const { game, category, sort, page, limit } = parsed.data
    const offset = (page - 1) * limit

    const conditions: string[] = ['p.is_deleted = FALSE', 'p.is_published = TRUE']
    const params: unknown[] = []
    let paramIndex = 1

    if (game) {
      conditions.push(`p.game_id = (SELECT id FROM games WHERE slug = $${paramIndex})`)
      params.push(game)
      paramIndex++
    }

    if (category) {
      conditions.push(`p.category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    let orderClause: string
    switch (sort) {
      case 'top':
        orderClause = '(COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)) DESC'
        break
      case 'trending':
        orderClause = `(COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5) DESC`
        break
      default:
        orderClause = 'p.created_at DESC'
    }

    // Count query
    const countSql = `SELECT COUNT(DISTINCT p.id) as total FROM posts p WHERE ${whereClause}`
    const countResult = await query<{ total: string }>(countSql, params)
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10)

    // Data query
    const dataSql = `
      SELECT
        p.id, p.title, p.category, p.game_id, p.author_id,
        p.view_count, p.created_at, p.updated_at,
        u.username as author_username, u.avatar_url as author_avatar,
        g.name as game_name, g.slug as game_slug,
        COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0)::int as upvotes,
        COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)::int as downvotes,
        COUNT(DISTINCT c.id)::int as comment_count
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      LEFT JOIN games g ON g.id = p.game_id
      LEFT JOIN votes v ON v.target_type = 'post' AND v.target_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id AND c.is_deleted = FALSE
      WHERE ${whereClause}
      GROUP BY p.id, u.username, u.avatar_url, g.name, g.slug
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const dataParams = [...params, limit, offset]
    const dataResult = await query<{
      id: string; title: string; category: string; game_id: string; author_id: string
      view_count: number; created_at: string; updated_at: string
      author_username: string; author_avatar: string | null
      game_name: string | null; game_slug: string | null
      upvotes: number; downvotes: number; comment_count: number
    }>(dataSql, dataParams)

    const data = dataResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      author: { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar },
      game: row.game_name ? { id: row.game_id, name: row.game_name, slug: row.game_slug } : null,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      comment_count: row.comment_count,
      view_count: row.view_count,
      created_at: row.created_at,
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getRequestUser(request)
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' } },
        { status: 401 }
      )
    }

    if (user.role === 'guest') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Los invitados no pueden crear posts' } },
        { status: 403 }
      )
    }

    // Rate limit
    const rl = await rateLimitPostCreate(user.id)
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Has excedido el límite de creación de posts. Intenta más tarde.' } },
        { status: 429, headers: rateLimitHeaders(rl, 10) }
      )
    }

    const body = await request.json()
    const parsed = CreatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const input = parsed.data
    input.body = sanitizePostBody(input.body)

    // Validate media URLs
    if (input.media && input.media.length > 0) {
      for (const m of input.media) {
        if (m.type === 'video_embed' && !isAllowedEmbedUrl(m.url)) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: `URL de embed no permitida: ${m.url}. Solo se permiten YouTube y Vimeo.` } },
            { status: 422 }
          )
        }
        if (m.type === 'image' && !isValidImageUrl(m.url)) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: `URL de imagen inválida: ${m.url}. Debe ser HTTPS.` } },
            { status: 422 }
          )
        }
      }
    }

    const post = await withTransaction(async (client) => {
      const postResult = await client.query(
        `INSERT INTO posts (title, body, category, game_id, author_id, is_published)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.title, input.body, input.category, input.game_id ?? null, user.id, input.is_published]
      )
      const newPost = postResult.rows[0]

      if (input.media && input.media.length > 0) {
        for (let i = 0; i < input.media.length; i++) {
          const m = input.media[i]
          await client.query(
            `INSERT INTO post_media (post_id, type, url, position)
             VALUES ($1, $2, $3, $4)`,
            [newPost.id, m.type, m.url, m.position ?? i]
          )
        }
      }

      if (input.steps && input.steps.length > 0) {
        for (const s of input.steps) {
          await client.query(
            `INSERT INTO post_steps (post_id, step_num, title, body, image_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [newPost.id, s.step_num, s.title ?? '', s.body, s.image_url ?? null]
          )
        }
      }

      return newPost
    })

    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
