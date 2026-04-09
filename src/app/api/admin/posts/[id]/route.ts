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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role !== 'moderator' && user.role !== 'admin') {
    return err('FORBIDDEN', 'Acceso denegado', 403)
  }

  const { id } = await params

  // Verificar que el post existe
  const postCheck = await query(
    `SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  )
  if (postCheck.rowCount === 0) {
    return err('NOT_FOUND', 'Post no encontrado', 404)
  }

  // Soft delete
  await query(
    `UPDATE posts SET is_deleted = TRUE WHERE id = $1`,
    [id]
  )

  return new NextResponse(null, { status: 204 })
}
