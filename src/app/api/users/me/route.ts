import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sanitizePlainText } from '@/lib/sanitize'
import { UpdateUserSchema, formatZodError } from '@/lib/validation'

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

export async function GET(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)

  const result = await query<{
    id: string
    username: string
    email: string
    role: string
    avatar_url: string | null
    bio: string | null
    is_banned: boolean
    created_at: string
    updated_at: string
  }>(
    `SELECT id, username, email, role, avatar_url, bio, is_banned, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [user.id]
  )

  if (result.rowCount === 0) {
    return err('NOT_FOUND', 'Usuario no encontrado', 404)
  }

  return NextResponse.json(result.rows[0])
}

export async function PUT(request: NextRequest) {
  const user = getRequestUser(request)
  if (!user) return err('UNAUTHORIZED', 'No autenticado', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const parsed = UpdateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: formatZodError(parsed.error) } },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Si cambia username, verificar disponibilidad
  if (data.username) {
    const existing = await query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [data.username, user.id]
    )
    if (existing.rowCount! > 0) {
      return err('CONFLICT', 'El nombre de usuario ya está en uso', 409)
    }
  }

  // Sanitizar campos de texto
  const sanitizedUsername = data.username ? sanitizePlainText(data.username) : undefined
  const sanitizedBio = data.bio !== undefined ? (data.bio ? sanitizePlainText(data.bio) : data.bio) : undefined

  // Construir SET dinámico
  const setClauses: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (sanitizedUsername !== undefined) {
    setClauses.push(`username = $${paramIndex++}`)
    values.push(sanitizedUsername)
  }
  if (sanitizedBio !== undefined) {
    setClauses.push(`bio = $${paramIndex++}`)
    values.push(sanitizedBio)
  }
  if (data.avatar_url !== undefined) {
    setClauses.push(`avatar_url = $${paramIndex++}`)
    values.push(data.avatar_url)
  }

  if (setClauses.length === 0) {
    return err('VALIDATION_ERROR', 'No hay campos para actualizar', 422)
  }

  setClauses.push(`updated_at = NOW()`)
  values.push(user.id)

  const result = await query<{
    id: string
    username: string
    email: string
    role: string
    avatar_url: string | null
    bio: string | null
    is_banned: boolean
    created_at: string
    updated_at: string
  }>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, username, email, role, avatar_url, bio, is_banned, created_at, updated_at`,
    values
  )

  return NextResponse.json(result.rows[0])
}
