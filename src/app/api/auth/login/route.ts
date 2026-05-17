import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { LoginSchema, formatZodError } from '@/lib/validation'
import { verifyPassword } from '@/lib/password'
import { signAccessToken, signRefreshToken, REFRESH_TOKEN_COOKIE } from '@/lib/auth'
import { rateLimitLogin, getClientIp, rateLimitHeaders } from '@/lib/ratelimit'
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
    const rlResult = await rateLimitLogin(ip)
    if (!rlResult.success) {
      const res = errorResponse('RATE_LIMITED', 'Demasiados intentos. Intenta más tarde.', 429)
      const headers = rateLimitHeaders(rlResult, 10)
      for (const [key, value] of Object.entries(headers)) {
        res.headers.set(key, value)
      }
      return res
    }

    // 2. Validar body con Zod
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de login inválidos', 400, {
        fields: formatZodError(parsed.error),
      })
    }

    const { email, password } = parsed.data

    // 3. Buscar usuario por email
    const result = await query<{
      id: string
      username: string
      email: string
      password_hash: string
      role: UserRole
      avatar_url: string | null
      is_banned: boolean
    }>(
      'SELECT id, username, email, password_hash, role, avatar_url, is_banned FROM users WHERE email = $1',
      [email]
    )

    const user = result.rows[0]

    // 4. Verificar password (mismo error genérico si usuario no existe o password incorrecta)
    if (!user) {
      return errorResponse('INVALID_CREDENTIALS', 'Email o contraseña incorrectos', 401)
    }

    const passwordValid = await verifyPassword(password, user.password_hash)
    if (!passwordValid) {
      return errorResponse('INVALID_CREDENTIALS', 'Email o contraseña incorrectos', 401)
    }

    // 5. Verificar que no esté baneado
    if (user.is_banned) {
      return errorResponse('FORBIDDEN', 'Tu cuenta ha sido suspendida', 403)
    }

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
          avatar_url: user.avatar_url,
        },
        accessToken,
      },
      { status: 200 }
    )

    setRefreshCookie(response, refreshToken)

    const headers = rateLimitHeaders(rlResult, 10)
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }

    return response
  } catch (error) {
    console.error('[Login Error]', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
