/**
 * Auth helper para Server Components.
 *
 * Resuelve la sesión actual leyendo la cookie httpOnly del refresh token,
 * la verifica, comprueba revocación y baneo, y emite un access token efímero
 * que se inyecta como Authorization Bearer en fetches internos a /api/*.
 *
 * No rota el refresh token (cero side effects en SSR).
 * No llama a /api/auth/refresh por HTTP (usa src/lib/auth directamente).
 *
 * Memoizado con React.cache() para que múltiples Server Components que
 * coexisten en un mismo render no dispararen N consultas a BD ni N firmas
 * de access token.
 */

import { cookies } from 'next/headers'
import { cache } from 'react'
import {
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  verifyRefreshToken,
} from '@/lib/auth'
import { query } from '@/lib/db'
import type { UserRole } from '@/types'

export interface ServerAuthSession {
  accessToken: string
  userId: string
  username: string
  role: UserRole
}

/**
 * Devuelve la sesión del viewer actual o null si es guest.
 * Cualquier fallo (cookie ausente, JWT inválido, revocado, baneado) → null.
 */
export const getServerAuth = cache(async (): Promise<ServerAuthSession | null> => {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return null

  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    return null
  }

  // Refresh token revocado (el user hizo logout)
  const revoked = await query<{ jti: string }>(
    'SELECT jti FROM revoked_tokens WHERE jti = $1',
    [payload.jti]
  )
  if (revoked.rows.length > 0) return null

  // Lookup del usuario
  const userResult = await query<{
    id: string
    username: string
    role: UserRole
    is_banned: boolean
  }>(
    'SELECT id, username, role, is_banned FROM users WHERE id = $1',
    [payload.sub]
  )
  const user = userResult.rows[0]
  if (!user || user.is_banned) return null

  const accessToken = await signAccessToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    accessToken,
    userId: user.id,
    username: user.username,
    role: user.role,
  }
})

/**
 * Fetcher autenticado para usar dentro de Server Components.
 *
 * - Si hay sesión activa, inyecta Authorization: Bearer <accessToken>.
 * - Fuerza `cache: 'no-store'` cuando hay sesión, porque la respuesta es
 *   personalizada (bloqueos, is_following, etc.) y NO debe compartirse en
 *   el cache de fetch de Next.js entre usuarios distintos.
 * - Si no hay sesión, respeta las opts del caller (ISR/revalidate OK para
 *   contenido público).
 * - Devuelve null si la respuesta no es ok o hay error de red, igual que
 *   el apiFetch genérico ya existente.
 */
export async function serverApiFetch<T>(
  path: string,
  opts?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }
): Promise<T | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await getServerAuth()

  const headers = new Headers(opts?.headers)
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`)

  const finalOpts: RequestInit = {
    ...opts,
    headers,
    ...(session ? { cache: 'no-store' as RequestCache } : {}),
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, finalOpts)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
