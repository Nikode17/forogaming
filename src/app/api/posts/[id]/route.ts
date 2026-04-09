import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { UpdatePostSchema, formatZodError } from '@/lib/validation'
import { sanitizePostBody, isAllowedEmbedUrl, isValidImageUrl } from '@/lib/sanitize'

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
// GET /api/posts/:id
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch post with author and game
    const postResult = await query<{
      id: string; title: string; body: string; category: string
      game_id: string | null; author_id: string | null
      is_published: boolean; view_count: number
      created_at: string; updated_at: string
      author_username: string | null; author_avatar: string | null
      game_name: string | null; game_slug: string | null
    }>(`
      SELECT p.id, p.title, p.body, p.category, p.game_id, p.author_id,
             p.is_published, p.view_count, p.created_at, p.updated_at,
             u.username  AS author_username,
             u.avatar_url AS author_avatar,
             g.name      AS game_name,
             g.slug      AS game_slug
      FROM   posts p
      LEFT JOIN users u ON u.id = p.author_id
      LEFT JOIN games g ON g.id = p.game_id
      WHERE  p.id = $1 AND p.is_deleted = FALSE
    `, [id])

    if (postResult.rows.length === 0) {
      return err('NOT_FOUND', 'Post no encontrado', 404)
    }

    const row = postResult.rows[0]

    // Parallel fetches for media, steps, and vote/like counts
    const [mediaResult, stepsResult, votesResult, likesResult] = await Promise.all([
      query<{ id: string; type: string; url: string; position: number }>(`
        SELECT id, type, url, position
        FROM   post_media
        WHERE  post_id = $1
        ORDER  BY position ASC
      `, [id]),
      query<{ id: string; step_num: number; title: string; body: string; image_url: string | null }>(`
        SELECT id, step_num, title, body, image_url
        FROM   post_steps
        WHERE  post_id = $1
        ORDER  BY step_num ASC
      `, [id]),
      query<{ upvotes: string; downvotes: string }>(`
        SELECT
          COALESCE(SUM(CASE WHEN value = 1  THEN 1 ELSE 0 END), 0) AS upvotes,
          COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
        FROM votes
        WHERE target_type = 'post' AND target_id = $1
      `, [id]),
      query<{ like_count: string }>(`
        SELECT COUNT(*) AS like_count
        FROM   likes
        WHERE  target_type = 'post' AND target_id = $1
      `, [id]),
    ])

    // Fire-and-forget view count increment
    query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1', [id]).catch(() => {})

    const votes = votesResult.rows[0]
    const post = {
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      is_published: row.is_published,
      view_count: row.view_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: row.author_id
        ? { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar }
        : null,
      game: row.game_id
        ? { id: row.game_id, name: row.game_name, slug: row.game_slug }
        : null,
      media: mediaResult.rows,
      steps: stepsResult.rows,
      upvotes: Number(votes?.upvotes ?? 0),
      downvotes: Number(votes?.downvotes ?? 0),
      like_count: Number(likesResult.rows[0]?.like_count ?? 0),
    }

    return NextResponse.json({ data: post })
  } catch (error) {
    console.error('[GET /api/posts/:id]', error)
    return err('INTERNAL_ERROR', 'Error al obtener el post', 500)
  }
}

// ---------------------------------------------------------------------------
// PUT /api/posts/:id
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    // Check post exists
    const postResult = await query<{ id: string; author_id: string }>(`
      SELECT id, author_id FROM posts WHERE id = $1 AND is_deleted = FALSE
    `, [id])

    if (postResult.rows.length === 0) {
      return err('NOT_FOUND', 'Post no encontrado', 404)
    }

    const post = postResult.rows[0]

    // Authorization: author or mod+
    if (user.id !== post.author_id && user.role !== 'moderator' && user.role !== 'admin') {
      return err('FORBIDDEN', 'No tienes permiso para editar este post', 403)
    }

    const body = await request.json()
    const parsed = UpdatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Sanitize body if present
    if (data.body !== undefined) {
      data.body = sanitizePostBody(data.body)
    }

    // Validate media URLs if present
    if (data.media && data.media.length > 0) {
      for (const m of data.media) {
        if (m.type === 'video_embed' && !isAllowedEmbedUrl(m.url)) {
          return err('VALIDATION_ERROR', `URL de embed no permitida: ${m.url}. Solo YouTube y Vimeo.`, 422)
        }
        if (m.type === 'image' && !isValidImageUrl(m.url)) {
          return err('VALIDATION_ERROR', `URL de imagen invalida: ${m.url}. Debe ser HTTPS.`, 422)
        }
      }
    }

    // Build dynamic UPDATE
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title) }
    if (data.body !== undefined) { fields.push(`body = $${idx++}`); values.push(data.body) }
    if (data.category !== undefined) { fields.push(`category = $${idx++}`); values.push(data.category) }
    if (data.game_id !== undefined) { fields.push(`game_id = $${idx++}`); values.push(data.game_id) }
    if (data.is_published !== undefined) { fields.push(`is_published = $${idx++}`); values.push(data.is_published) }

    // Always update updated_at when editing
    fields.push(`updated_at = NOW()`)

    const hasMediaOrSteps = (data.media !== undefined) || (data.steps !== undefined)

    if (hasMediaOrSteps) {
      // Use transaction for post + media/steps
      const updated = await withTransaction(async (client) => {
        if (fields.length > 1) {
          // More than just updated_at
          values.push(id)
          await client.query(
            `UPDATE posts SET ${fields.join(', ')} WHERE id = $${idx}`,
            values
          )
        }

        // Replace media
        if (data.media !== undefined) {
          await client.query('DELETE FROM post_media WHERE post_id = $1', [id])
          for (let i = 0; i < data.media.length; i++) {
            const m = data.media[i]
            await client.query(
              'INSERT INTO post_media (post_id, type, url, position) VALUES ($1, $2, $3, $4)',
              [id, m.type, m.url, m.position ?? i]
            )
          }
        }

        // Replace steps
        if (data.steps !== undefined) {
          await client.query('DELETE FROM post_steps WHERE post_id = $1', [id])
          for (const s of data.steps) {
            await client.query(
              'INSERT INTO post_steps (post_id, step_num, title, body, image_url) VALUES ($1, $2, $3, $4, $5)',
              [id, s.step_num, s.title ?? '', s.body, s.image_url ?? null]
            )
          }
        }

        const result = await client.query('SELECT * FROM posts WHERE id = $1', [id])
        return result.rows[0]
      })

      return NextResponse.json({ data: updated })
    } else if (fields.length > 1) {
      // Simple update without media/steps (more than just updated_at)
      values.push(id)
      const result = await query(
        `UPDATE posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      )
      return NextResponse.json({ data: result.rows[0] })
    } else {
      // Nothing to update
      const result = await query('SELECT * FROM posts WHERE id = $1', [id])
      return NextResponse.json({ data: result.rows[0] })
    }
  } catch (error) {
    console.error('[PUT /api/posts/:id]', error)
    return err('INTERNAL_ERROR', 'Error al actualizar el post', 500)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/posts/:id
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    const postResult = await query<{ id: string; author_id: string }>(`
      SELECT id, author_id FROM posts WHERE id = $1 AND is_deleted = FALSE
    `, [id])

    if (postResult.rows.length === 0) {
      return err('NOT_FOUND', 'Post no encontrado', 404)
    }

    const post = postResult.rows[0]

    if (user.id !== post.author_id && user.role !== 'moderator' && user.role !== 'admin') {
      return err('FORBIDDEN', 'No tienes permiso para eliminar este post', 403)
    }

    await query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [id])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/posts/:id]', error)
    return err('INTERNAL_ERROR', 'Error al eliminar el post', 500)
  }
}
