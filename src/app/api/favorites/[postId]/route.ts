import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role === 'guest') return err('FORBIDDEN', 'Acceso denegado', 403)

  const { postId } = await params

  // Verificar que el post existe y no está eliminado
  const postCheck = await query(
    `SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE`,
    [postId]
  )
  if (postCheck.rowCount === 0) {
    return err('NOT_FOUND', 'Post no encontrado', 404)
  }

  await query(
    `INSERT INTO favorites (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [user.id, postId]
  )

  return NextResponse.json({ message: 'Guardado en favoritos' }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)

  const { postId } = await params

  await query(
    `DELETE FROM favorites WHERE user_id = $1 AND post_id = $2`,
    [user.id, postId]
  )

  return new NextResponse(null, { status: 204 })
}
