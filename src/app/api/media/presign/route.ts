import { NextRequest, NextResponse } from 'next/server'

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

  let body: { filename?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const { filename, type } = body
  if (!filename || !type) return err('VALIDATION_ERROR', 'filename y type son requeridos', 422)

  // Validar tipo MIME — solo imágenes permitidas (SDD 5.3: máx 10MB)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(type)) {
    return err('VALIDATION_ERROR', 'Tipo de archivo no permitido. Usa: jpeg, png, webp, gif', 422)
  }

  // TODO: Generar presigned URL real cuando S3_ENDPOINT esté configurado
  // Ejemplo con AWS SDK v3:
  // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
  // import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

  if (!process.env.S3_ENDPOINT) {
    // Stub para desarrollo local
    return NextResponse.json({
      presignedUrl: null,
      key: `uploads/${user.id}/${Date.now()}-${filename}`,
      message: 'S3 no configurado. Configura S3_ENDPOINT en .env.local para habilitar uploads.',
    }, { status: 501 })
  }

  return err('NOT_IMPLEMENTED', 'Configura las variables S3_* en .env.local', 501)
}
