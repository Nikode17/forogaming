import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { LikeSchema, formatZodError } from '@/lib/validation'

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

export async function POST(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)
  if (user.role === 'guest') return err('FORBIDDEN', 'Acceso denegado', 403)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const parsed = LikeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  const { target_type, target_id } = parsed.data

  // Verificar que el target existe
  const table = target_type === 'post' ? 'posts' : 'comments'
  const targetCheck = await query(
    `SELECT id FROM ${table} WHERE id = $1 AND is_deleted = FALSE`,
    [target_id]
  )
  if (targetCheck.rowCount === 0) {
    return err('NOT_FOUND', `${target_type} no encontrado`, 404)
  }

  await query(
    `INSERT INTO likes (user_id, target_type, target_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, target_type, target_id) DO NOTHING`,
    [user.id, target_type, target_id]
  )

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM likes WHERE target_type = $1 AND target_id = $2`,
    [target_type, target_id]
  )
  const like_count = parseInt(countResult.rows[0].count, 10)

  return NextResponse.json({ liked: true, like_count })
}

export async function DELETE(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const parsed = LikeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  const { target_type, target_id } = parsed.data

  await query(
    `DELETE FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
    [user.id, target_type, target_id]
  )

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM likes WHERE target_type = $1 AND target_id = $2`,
    [target_type, target_id]
  )
  const like_count = parseInt(countResult.rows[0].count, 10)

  return NextResponse.json({ liked: false, like_count })
}
