import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ResolveReportSchema, formatZodError } from '@/lib/validation'

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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const parsed = ResolveReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  // Verificar que el reporte existe
  const reportCheck = await query(
    `SELECT id FROM reports WHERE id = $1`,
    [id]
  )
  if (reportCheck.rowCount === 0) {
    return err('NOT_FOUND', 'Reporte no encontrado', 404)
  }

  const result = await query<{
    id: string
    target_type: string
    target_id: string
    reason: string
    status: string
    created_at: string
    updated_at: string
  }>(
    `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, target_type, target_id, reason, status, created_at, updated_at`,
    [parsed.data.status, id]
  )

  return NextResponse.json({ report: result.rows[0] })
}
