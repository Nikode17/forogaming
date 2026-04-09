import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { UpdateCommentSchema, formatZodError } from '@/lib/validation'
import { sanitizeComment } from '@/lib/sanitize'

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
// PUT /api/comments/:id
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    // Fetch comment
    const commentResult = await query<{ id: string; author_id: string; is_deleted: boolean }>(`
      SELECT id, author_id, is_deleted FROM comments WHERE id = $1
    `, [id])

    if (commentResult.rows.length === 0 || commentResult.rows[0].is_deleted) {
      return err('NOT_FOUND', 'Comentario no encontrado', 404)
    }

    const comment = commentResult.rows[0]

    // Only the author can edit (not even mods)
    if (user.id !== comment.author_id) {
      return err('FORBIDDEN', 'Solo el autor puede editar este comentario', 403)
    }

    const body = await request.json()
    const parsed = UpdateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: formatZodError(parsed.error) } },
        { status: 422 }
      )
    }

    const sanitizedBody = sanitizeComment(parsed.data.body)

    const result = await query<{
      id: string; post_id: string; author_id: string; parent_id: string | null
      body: string; is_deleted: boolean; created_at: string; updated_at: string
    }>(`
      UPDATE comments SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [sanitizedBody, id])

    return NextResponse.json({ data: result.rows[0] })
  } catch (error) {
    console.error('[PUT /api/comments/:id]', error)
    return err('INTERNAL_ERROR', 'Error al actualizar el comentario', 500)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/comments/:id
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = getRequestUser(request)
    if (!user) return err('UNAUTHORIZED', 'Autenticacion requerida', 401)

    const commentResult = await query<{ id: string; author_id: string; is_deleted: boolean }>(`
      SELECT id, author_id, is_deleted FROM comments WHERE id = $1
    `, [id])

    if (commentResult.rows.length === 0 || commentResult.rows[0].is_deleted) {
      return err('NOT_FOUND', 'Comentario no encontrado', 404)
    }

    const comment = commentResult.rows[0]

    // Author or mod+ can delete
    if (user.id !== comment.author_id && user.role !== 'moderator' && user.role !== 'admin') {
      return err('FORBIDDEN', 'No tienes permiso para eliminar este comentario', 403)
    }

    await query('UPDATE comments SET is_deleted = TRUE WHERE id = $1', [id])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/comments/:id]', error)
    return err('INTERNAL_ERROR', 'Error al eliminar el comentario', 500)
  }
}
