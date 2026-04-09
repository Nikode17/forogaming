import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { verifyAccessToken, extractBearerToken } from '@/lib/auth'

const f = createUploadthing()

async function getAuthUser(req: Request) {
  const token = extractBearerToken(req)
  if (!token) throw new UploadThingError('No autenticado')
  try {
    const payload = await verifyAccessToken(token)
    return { userId: payload.sub, username: payload.username }
  } catch {
    throw new UploadThingError('Token inválido')
  }
}

export const ourFileRouter = {
  // Subida de avatares — máx 2MB, 1 archivo
  avatarUploader: f({
    image: { maxFileSize: '2MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => getAuthUser(req))
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId }
    }),

  // Imágenes para posts — máx 8MB, hasta 4 archivos
  postImageUploader: f({
    image: { maxFileSize: '8MB', maxFileCount: 4 },
  })
    .middleware(async ({ req }) => getAuthUser(req))
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
