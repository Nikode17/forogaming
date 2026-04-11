// ============================================================
// Tipos del dominio — Respawn
// ============================================================

// --- Roles ---

export type UserRole = 'admin' | 'moderator' | 'user' | 'guest'

// --- Entidades ---

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  avatar_url: string | null
  bio: string | null
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  name: string
  slug: string
  cover_url: string | null
  description: string | null
  created_at: string
}

export type PostCategory = 'guide' | 'easter-egg' | 'review' | 'general'

export interface Post {
  id: string
  title: string
  body: string
  category: PostCategory
  game_id: string
  author_id: string
  is_published: boolean
  is_deleted: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export type MediaType = 'image' | 'video_embed'

export interface PostMedia {
  id: string
  post_id: string
  type: MediaType
  url: string
  position: number
  created_at: string
}

export interface PostStep {
  id: string
  post_id: string
  step_num: number
  title: string
  body: string
  image_url: string | null
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type VoteTargetType = 'post' | 'comment'

export interface Vote {
  id: string
  user_id: string
  target_type: VoteTargetType
  target_id: string
  value: 1 | -1
  created_at: string
}

export type LikeTargetType = 'post' | 'comment'

export interface Like {
  id: string
  user_id: string
  target_type: LikeTargetType
  target_id: string
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type ReportTargetType = 'post' | 'comment' | 'user'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  status: ReportStatus
  created_at: string
}

// --- JWT ---

export interface JWTPayload {
  sub: string
  username: string
  role: UserRole
  iat: number
  exp: number
}

// --- Respuestas API ---

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
