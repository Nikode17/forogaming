import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateReportSchema, formatZodError } from '@/lib/validation'

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

  const parsed = CreateReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  const { target_type, target_id, reason } = parsed.data

  // Verificar que el target existe según tipo
  let targetTable: string
  let targetCondition: string
  switch (target_type) {
    case 'post':
      targetTable = 'posts'
      targetCondition = 'id = $1 AND is_deleted = FALSE'
      break
    case 'comment':
      targetTable = 'comments'
      targetCondition = 'id = $1 AND is_deleted = FALSE'
      break
    case 'user':
      targetTable = 'users'
      targetCondition = 'id = $1'
      break
  }

  const targetCheck = await query(
    `SELECT id FROM ${targetTable} WHERE ${targetCondition}`,
    [target_id]
  )
  if (targetCheck.rowCount === 0) {
    return err('NOT_FOUND', `${target_type} no encontrado`, 404)
  }

  // Verificar que no haya reporte duplicado
  const duplicateCheck = await query(
    `SELECT id FROM reports WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 LIMIT 1`,
    [user.id, target_type, target_id]
  )
  if (duplicateCheck.rowCount! > 0) {
    return err('CONFLICT', 'Ya has reportado este contenido', 409)
  }

  const result = await query<{ id: string; status: string }>(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, status`,
    [user.id, target_type, target_id, reason]
  )

  return NextResponse.json(
    { message: 'Reporte enviado', report: result.rows[0] },
    { status: 201 }
  )
}
