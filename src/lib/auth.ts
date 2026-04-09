import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@/types'

export const REFRESH_TOKEN_COOKIE = 'fg_refresh_token'
export const ACCESS_TOKEN_EXPIRES = '15m'
export const REFRESH_TOKEN_EXPIRES = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Genera un access token JWT con duración de 15 minutos.
 */
export async function signAccessToken(payload: {
  sub: string
  username: string
  role: UserRole
}): Promise<string> {
  const jti = crypto.randomUUID()

  return new SignJWT({
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(getSecret())
}

/**
 * Genera un refresh token JWT con duración de 7 días.
 */
export async function signRefreshToken(payload: {
  sub: string
}): Promise<string> {
  const jti = crypto.randomUUID()

  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(getSecret())
}

/**
 * Verifica un access token y devuelve el payload tipado.
 */
export async function verifyAccessToken(token: string): Promise<{
  sub: string
  username: string
  role: UserRole
  iat: number
  exp: number
  jti: string
}> {
  const { payload } = await jwtVerify(token, getSecret())

  return {
    sub: payload.sub as string,
    username: payload.username as string,
    role: payload.role as UserRole,
    iat: payload.iat as number,
    exp: payload.exp as number,
    jti: payload.jti as string,
  }
}

/**
 * Verifica un refresh token y devuelve sub + jti.
 */
export async function verifyRefreshToken(token: string): Promise<{
  sub: string
  jti: string
  exp: number
}> {
  const { payload } = await jwtVerify(token, getSecret())

  return {
    sub: payload.sub as string,
    jti: payload.jti as string,
    exp: payload.exp as number,
  }
}

/**
 * Extrae el Bearer token del header Authorization.
 * Retorna null si no hay header o el formato es inválido.
 */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}
