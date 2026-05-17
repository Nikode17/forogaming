import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateCommentSchema, formatZodError } from '@/lib/validation'
import { sanitizeComment } from '@/lib/sanitize'
import { excludeBlockedSql, getBlockRelation, hasAnyBlock } from '@/lib/blocks'

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
// Comment tree builder
// ---------------------------------------------------------------------------
interface CommentNode {
  id: string
  author_id: string | null
  parent_id: string | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  author: { id: string; username: string; avatar_url: string | null } | null
  upvotes: number
  downvotes: number
  replies: CommentNode[]
}

function buildTree(flat: CommentNode[]): CommentNode[] {
  const map = new Map<string, CommentNode>(
    flat.map(c => [c.id, { ...c, replies: [] as CommentNode[] }])
  )
  const roots: CommentNode[] = []
  for (const comment of map.values()) {
    if (comment.parent_id) {
      map.get(comment.parent_id)?.replies.push(comment)
    } else {
      roots.push(comment)
    }
  }
  return roots
}

// ---------------------------------------------------------------------------
// GET /api/posts/:id/comments
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Filtro de bloqueos: si el caller está logueado, no traer comentarios
    // cuyo autor tenga relación de bloqueo en cualquier dirección. Los
    // replies legítimos cuyo ancestro sea bloqueado quedan huérfanos en el
    // SQL y buildTree los descarta silenciosamente (decisión c1 = ocultar
    // subárbol completo).
    const meId = request.headers.get('x-user-id')
    const sqlParams: unknown[] = [id]
    let blockedClause = ''
    if (meId) {
      sqlParams.push(meId)
      blockedClause = ` AND (c.author_id IS NULL OR ${excludeBlockedSql('c.author_id', '$2')})`
    }

    const result = await query<{
      id: string; post_id: string; author_id: string | null; parent_id: string | null
      body: string; is_deleted: boolean; created_at: string; updated_at: string
      author_username: string | null; author_avatar: string | null
      upvotes: string; downvotes: string
    }>(`
      SELECT c.id, c.post_id, c.author_id, c.parent_id, c.body, c.is_deleted,
             c.created_at, c.updated_at,
             u.username   AS author_username,
             u.avatar_url AS author_avatar,
             COALESCE(SUM(CASE WHEN v.value = 1  THEN 1 ELSE 0 END), 0) AS upvotes,
             COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
      FROM   comments c
      LEFT JOIN users u ON u.id = c.author_id
      LEFT JOIN votes v ON v.target_type = 'comment' AND v.target_id = c.id
      WHERE  c.post_id = $1
        ${blockedClause}
      GROUP  BY c.id, u.username, u.avatar_url
      ORDER  BY c.created_at ASC
    `, sqlParams)

    const flat: CommentNode[] = result.rows.map(r => {
      if (r.is_deleted) {
        return {
          id: r.id,
          author_id: null,
          parent_id: r.parent_id,
          body: '[eliminado]',
          is_deleted: true,
          created_at: r.created_at,
          updated_at: r.updated_at,
          author: null,
          upvotes: Number(r.upvotes),
          downvotes: Number(r.downvotes),
          replies: [],
        }
      }
      return {
        id: r.id,
        author_id: r.author_id,
        parent_id: r.parent_id,
        body: r.body,
        is_deleted: false,
        created_at: r.created_at,
        updated_at: r.updated_at,
        author: r.author_username && r.author_id
          ? { id: r.author_id, username: r.author_username, avatar_url: r.author_avatar }
          : null,
        upvotes: Number(r.upvotes),
        downvotes: Number(r.downvotes),
        replies: [],
      }
    })

    const tree = buildTree(flat)
    return NextResponse.json({ data: tree })
  } catch (error) {
    console.error('[GET /api/posts/:id/comments]', error)
    return err('INTERNAL_ERROR', 'Error al obtener comentarios', 500)
  }
}

// ---------------------------------------------------------------------------
// POST /api/posts/:id/comments
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    if (user.role === 'guest') {
      return err('FORBIDDEN', 'Los invitados no pueden comentar', 403)
    }

    // Verify post exists and is not deleted
    const postResult = await query<{ id: string; author_id: string | null }>(`
      SELECT id, author_id FROM posts WHERE id = $1 AND is_deleted = FALSE
    `, [postId])

    if (postResult.rows.length === 0) {
      return err('NOT_FOUND', 'Post no encontrado', 404)
    }

    // 403 si el autor del post tiene relación de bloqueo bidireccional con el caller
    const postAuthorId = postResult.rows[0].author_id
    if (postAuthorId) {
      const rel = await getBlockRelation(user.id, postAuthorId)
      if (hasAnyBlock(rel)) {
        return err('FORBIDDEN', 'No puedes comentar en este post', 403)
      }
    }

    const body = await request.json()
    const parsed = CreateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Verify parent comment if provided
    if (data.parent_id) {
      const parentResult = await query<{ id: string; post_id: string }>(`
        SELECT id, post_id FROM comments WHERE id = $1
      `, [data.parent_id])

      if (parentResult.rows.length === 0) {
        return err('NOT_FOUND', 'Comentario padre no encontrado', 404)
      }

      if (parentResult.rows[0].post_id !== postId) {
        return err('VALIDATION_ERROR', 'El comentario padre no pertenece a este post', 422)
      }
    }

    const sanitizedBody = sanitizeComment(data.body)

    const result = await query<{
      id: string; post_id: string; author_id: string; parent_id: string | null
      body: string; is_deleted: boolean; created_at: string; updated_at: string
    }>(`
      INSERT INTO comments (post_id, author_id, parent_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [postId, user.id, data.parent_id ?? null, sanitizedBody])

    const comment = result.rows[0]

    return NextResponse.json({
      data: {
        ...comment,
        author: { id: user.id, username: user.username },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/posts/:id/comments]', error)
    return err('INTERNAL_ERROR', 'Error al crear comentario', 500)
  }
}
