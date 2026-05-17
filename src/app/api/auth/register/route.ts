import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { RegisterSchema, formatZodError } from '@/lib/validation'
import { hashPassword } from '@/lib/password'
import { signAccessToken, signRefreshToken, REFRESH_TOKEN_COOKIE } from '@/lib/auth'
import { rateLimitRegister, getClientIp, rateLimitHeaders } from '@/lib/ratelimit'
import type { UserRole } from '@/types'

function errorResponse(code: string, message: string, status: number, extra?: object) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status })
}

function setRefreshCookie(response: NextResponse, token: string): void {
  const cookieOptions = [
    `${REFRESH_TOKEN_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`,
    ...(process.env.APP_ENV === 'production' ? ['Secure'] : []),
  ].join('; ')

  response.headers.set('Set-Cookie', cookieOptions)
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit por IP
    const ip = getClientIp(request)
    const rlResult = await rateLimitRegister(ip)
    if (!rlResult.success) {
      const res = errorResponse('RATE_LIMITED', 'Demasiados intentos. Intenta más tarde.', 429)
      const headers = rateLimitHeaders(rlResult, 5)
      for (const [key, value] of Object.entries(headers)) {
        res.headers.set(key, value)
      }
      return res
    }

    // 2. Validar body con Zod
    const body = await request.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de registro inválidos', 400, {
        fields: formatZodError(parsed.error),
      })
    }

    const { username, email, password } = parsed.data

    // 3. Verificar que username y email no existan
    const existingEmail = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existingEmail.rowCount && existingEmail.rowCount > 0) {
      return errorResponse('CONFLICT', 'El email ya está registrado', 409)
    }

    const existingUsername = await query<{ id: string }>(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    if (existingUsername.rowCount && existingUsername.rowCount > 0) {
      return errorResponse('CONFLICT', 'El nombre de usuario ya está en uso', 409)
    }

    // 4. Hash de password
    const passwordHash = await hashPassword(password)

    // 5. INSERT en users
    const insertResult = await query<{
      id: string
      username: string
      email: string
      role: UserRole
      created_at: string
    }>(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    )

    const user = insertResult.rows[0]

    // 6. Generar tokens
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, username: user.username, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ])

    // 7 & 8. SET-COOKIE y retornar respuesta
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        accessToken,
      },
      { status: 201 }
    )

    setRefreshCookie(response, refreshToken)

    const headers = rateLimitHeaders(rlResult, 5)
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }

    return response
  } catch (error) {
    console.error('[Register Error]', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
