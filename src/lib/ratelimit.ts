/**
 * Rate limiter en memoria usando sliding window.
 * Para producción con múltiples instancias, migrar a Redis (ej: @upstash/ratelimit).
 * TODO: Migrar a Redis/Upstash cuando se escale horizontalmente
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Map global para almacenar contadores (se resetea al reiniciar el servidor)
const store = new Map<string, RateLimitEntry>()

// Limpieza periódica para evitar memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60_000) // limpiar cada minuto

interface RateLimitConfig {
  /** Número máximo de solicitudes permitidas en la ventana */
  limit: number
  /** Duración de la ventana en milisegundos */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  /** Requests restantes en la ventana actual */
  remaining: number
  /** Timestamp (ms) cuando se resetea el contador */
  resetAt: number
}

function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // Nueva ventana
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// =====================
// Rate limiters predefinidos según SDD sección 5.3
// =====================

/** Login: 10 intentos por IP cada 15 minutos */
export function rateLimitLogin(ip: string): RateLimitResult {
  return checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })
}

/** Registro: 5 cuentas por IP cada hora */
export function rateLimitRegister(ip: string): RateLimitResult {
  return checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })
}

/** Creación de posts: 10 por usuario por hora */
export function rateLimitPostCreate(userId: string): RateLimitResult {
  return checkRateLimit(`post_create:${userId}`, { limit: 10, windowMs: 60 * 60 * 1000 })
}

/** Votos: 100 por usuario por hora */
export function rateLimitVote(userId: string): RateLimitResult {
  return checkRateLimit(`vote:${userId}`, { limit: 100, windowMs: 60 * 60 * 1000 })
}

/** API general: 100 requests por IP por minuto */
export function rateLimitGeneral(ip: string): RateLimitResult {
  return checkRateLimit(`general:${ip}`, { limit: 100, windowMs: 60 * 1000 })
}

/**
 * Obtiene la IP del cliente desde los headers de Next.js.
 * Considera proxies inversos (Vercel, Cloudflare, etc.).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}

/**
 * Genera headers estándar de rate limit para las respuestas HTTP.
 */
export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
