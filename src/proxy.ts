import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractBearerToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const token = extractBearerToken(request)

  if (token) {
    try {
      const payload = await verifyAccessToken(token)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.sub)
      requestHeaders.set('x-user-role', payload.role)
      requestHeaders.set('x-user-username', payload.username)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch {
      // Token inválido — continuar sin headers de usuario
      // Las route handlers que requieren auth retornarán 401 ellas mismas
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
