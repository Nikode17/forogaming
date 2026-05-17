import { z } from 'zod'

// =====================
// AUTH
// =====================

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede superar 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
  email: z.string().email('Email inválido').max(255),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede superar 100 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>

// =====================
// POSTS
// =====================

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(500, 'El título no puede superar 500 caracteres'),
  body: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
  category: z.enum(['guide', 'easter-egg', 'review', 'general'], {
    errorMap: () => ({ message: 'Categoría inválida' }),
  }),
  game_id: z.string().uuid('game_id inválido').optional().nullable(),
  is_published: z.boolean().optional().default(true),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video_embed']),
        url: z.string().url('URL de media inválida').max(2000),
        position: z.number().int().min(0).optional(),
      })
    )
    .max(20, 'Demasiados elementos media')
    .refine(
      (items) => items.filter((m) => m.type === 'image').length <= 10,
      { message: 'Máximo 10 imágenes por post' }
    )
    .optional()
    .default([]),
  steps: z
    .array(
      z.object({
        step_num: z.number().int().min(1),
        title: z.string().max(255).optional(),
        body: z.string().min(1),
        image_url: z.string().url().optional().nullable(),
      })
    )
    .optional()
    .default([]),
})

export const UpdatePostSchema = CreatePostSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>

// =====================
// COMMENTS
// =====================

export const CreateCommentSchema = z.object({
  body: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(10000, 'El comentario es demasiado largo'),
  parent_id: z.string().uuid('parent_id inválido').optional().nullable(),
})

export const UpdateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
})

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>

// =====================
// VOTES & LIKES
// =====================

export const VoteSchema = z.object({
  target_type: z.enum(['post', 'comment']),
  target_id: z.string().uuid('target_id inválido'),
  value: z.literal(1).or(z.literal(-1)),
})

export const LikeSchema = z.object({
  target_type: z.enum(['post', 'comment']),
  target_id: z.string().uuid('target_id inválido'),
})

export const RemoveVoteSchema = z.object({
  target_type: z.enum(['post', 'comment']),
  target_id: z.string().uuid('target_id inválido'),
})

export type VoteInput = z.infer<typeof VoteSchema>
export type LikeInput = z.infer<typeof LikeSchema>

// =====================
// GAMES
// =====================

export const CreateGameSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  cover_url: z.string().url('URL de portada inválida').optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
})

export const UpdateGameSchema = CreateGameSchema.partial()

export type CreateGameInput = z.infer<typeof CreateGameSchema>
export type UpdateGameInput = z.infer<typeof UpdateGameSchema>

// =====================
// USERS
// =====================

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  bio: z.string().max(500).optional().nullable(),
  avatar_url: z.string().url('URL de avatar inválida').optional().nullable(),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

// =====================
// REPORTS
// =====================

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'misinformation',
  'other',
] as const

export const CreateReportSchema = z.object({
  target_type: z.enum(['post', 'comment', 'user', 'message']),
  target_id: z.string().uuid('target_id inválido'),
  reason: z.enum(REPORT_REASONS, {
    errorMap: () => ({ message: 'Motivo no válido' }),
  }),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
})

export const ResolveReportSchema = z.object({
  action: z.enum(['dismiss', 'remove_content', 'ban_user']),
})

export type CreateReportInput = z.infer<typeof CreateReportSchema>
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>
export type ReportReason = (typeof REPORT_REASONS)[number]

// =====================
// QUERY PARAMS (paginación y filtros)
// =====================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const PostsQuerySchema = PaginationSchema.extend({
  game: z.string().optional(),
  category: z.enum(['guide', 'easter-egg', 'review', 'general']).optional(),
  sort: z.enum(['new', 'top', 'trending']).default('new'),
})

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'El término de búsqueda no puede estar vacío').max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type PaginationInput = z.infer<typeof PaginationSchema>
export type PostsQueryInput = z.infer<typeof PostsQuerySchema>
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>

// =====================
// HELPER: formatear errores Zod para respuesta API
// =====================

export function formatZodError(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}
