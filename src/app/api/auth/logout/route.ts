import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyRefreshToken, REFRESH_TOKEN_COOKIE } from '@/lib/auth'

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

    if (token) {
      try {
        // 2. Verificar el refresh token (ignorar errores de expiración)
        const tokenPayload = await verifyRefreshToken(token)

        // 3. Revocar el token insertando en revoked_tokens
        const expiresAt = new Date(tokenPayload.exp * 1000).toISOString()
        await query(
          'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING',
          [tokenPayload.jti, expiresAt]
        )
      } catch {
        // Token inválido o expirado — no importa, igual limpiamos la cookie
      }
    }

    // 4. Limpiar la cookie
    const response = NextResponse.json(
      { message: 'Sesión cerrada correctamente' },
      { status: 200 }
    )
    clearRefreshCookie(response)

    // 5. Retornar 200 — logout es idempotente
    return response
  } catch (error) {
    console.error('[Logout Error]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    )
  }
}
