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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role !== 'moderator' && user.role !== 'admin') {
    return err('FORBIDDEN', 'Acceso denegado', 403)
  }

  const { id } = await params

  let body: { is_banned?: boolean; reason?: string }
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  if (typeof body.is_banned !== 'boolean') {
    return err('VALIDATION_ERROR', 'is_banned es requerido y debe ser booleano', 422)
  }

  // Verificar que el usuario target existe
  const targetResult = await query<{ id: string; username: string; role: string }>(
    `SELECT id, username, role FROM users WHERE id = $1`,
    [id]
  )
  if (targetResult.rowCount === 0) {
    return err('NOT_FOUND', 'Usuario no encontrado', 404)
  }

  const target = targetResult.rows[0]

  // No permitir que un moderador banee a un admin
  if (target.role === 'admin' && user.role === 'moderator') {
    return err('FORBIDDEN', 'No puedes banear a un administrador', 403)
  }

  await query(
    `UPDATE users SET is_banned = $1 WHERE id = $2`,
    [body.is_banned, id]
  )

  return NextResponse.json({
    user: { id: target.id, username: target.username, is_banned: body.is_banned },
  })
}
