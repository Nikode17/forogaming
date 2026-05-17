import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth'
import type { UserRole } from '@/types'

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
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

function clearRefreshCookie(response: NextResponse): void {
  const cookieOptions = [
    `${REFRESH_TOKEN_COOKIE}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
    ...(process.env.APP_ENV === 'production' ? ['Secure'] : []),
  ].join('; ')

  response.headers.set('Set-Cookie', cookieOptions)
}

export async function POST(request: NextRequest) {
  try {
    // 1. Leer refreshToken de la cookie
    const token = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
    if (!token) {
      return errorResponse('UNAUTHORIZED', 'No se encontró token de refresco', 401)
    }

    // 2. Verificar refresh token
    let tokenPayload: { sub: string; jti: string; exp: number }
    try {
      tokenPayload = await verifyRefreshToken(token)
    } catch {
      // Token inválido o expirado — limpiar cookie
      const response = errorResponse('UNAUTHORIZED', 'Token de refresco inválido o expirado', 401)
      clearRefreshCookie(response)
      return response
    }

    // 3. Verificar que el jti NO esté revocado
    const revokedResult = await query<{ jti: string }>(
      'SELECT jti FROM revoked_tokens WHERE jti = $1',
      [tokenPayload.jti]
    )
    if (revokedResult.rowCount && revokedResult.rowCount > 0) {
      const response = errorResponse('UNAUTHORIZED', 'Token de refresco ha sido revocado', 401)
      clearRefreshCookie(response)
      return response
    }

    // 4. Buscar usuario en DB
    const userResult = await query<{
      id: string
      username: string
      role: UserRole
      is_banned: boolean
    }>(
      'SELECT id, username, role, is_banned FROM users WHERE id = $1',
      [tokenPayload.sub]
    )

    const user = userResult.rows[0]
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Usuario no encontrado', 401)
    }

    if (user.is_banned) {
      return errorResponse('FORBIDDEN', 'Tu cuenta ha sido suspendida', 403)
    }

    // 5. Revocar el token actual
    const expiresAt = new Date(tokenPayload.exp * 1000).toISOString()
    await query(
      'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2)',
      [tokenPayload.jti, expiresAt]
    )

    // 6. Generar nuevos tokens (rotación)
    const [accessToken, newRefreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, username: user.username, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ])

    // 7 & 8. SET-COOKIE y retornar respuesta
    const response = NextResponse.json({ accessToken }, { status: 200 })
    setRefreshCookie(response, newRefreshToken)

    return response
  } catch (error) {
    console.error('[Refresh Error]', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
