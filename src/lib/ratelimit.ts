/**
 * Rate limiter con sliding window.
 * En producción usa Upstash Redis (persistente, multi-instancia).
 * En desarrollo local usa un Map en memoria como fallback.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─────────────────────────────────────────────────────────────────────────────
// Resultado estándar
// ─────────────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback en memoria (desarrollo sin Upstash)
// ─────────────────────────────────────────────────────────────────────────────
interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of memStore) if (v.resetAt < now) memStore.delete(k)
}, 60_000)

function memLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) return { success: false, remaining: 0, resetAt: entry.resetAt }
  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clientes Upstash (lazy, solo si las env vars están configuradas)
// ─────────────────────────────────────────────────────────────────────────────
function hasUpstash(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// Cache de instancias Ratelimit (una por configuración)
const limiters = new Map<string, Ratelimit>()

function getLimiter(name: string, limit: number, windowSeconds: number): Ratelimit {
  if (!limiters.has(name)) {
    limiters.set(name, new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `rl:${name}`,
    }))
  }
  return limiters.get(name)!
}

async function upstashLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, limit, windowSeconds)
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Función unificada: usa Upstash si está disponible, sino memoria
// ─────────────────────────────────────────────────────────────────────────────
async function checkLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (hasUpstash()) {
    return upstashLimit(name, identifier, limit, windowSeconds)
  }
  return memLimit(`${name}:${identifier}`, limit, windowSeconds * 1000)
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiters según SDD sección 5.3
// ─────────────────────────────────────────────────────────────────────────────

/** Login: 10 intentos por IP cada 15 minutos */
export function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return checkLimit('login', ip, 10, 15 * 60)
}

/** Registro: 5 cuentas por IP cada hora */
export function rateLimitRegister(ip: string): Promise<RateLimitResult> {
  return checkLimit('register', ip, 5, 60 * 60)
}

/** Creación de posts: 10 por usuario por hora */
export function rateLimitPostCreate(userId: string): Promise<RateLimitResult> {
  return checkLimit('post_create', userId, 10, 60 * 60)
}

/** Votos: 100 por usuario por hora */
export function rateLimitVote(userId: string): Promise<RateLimitResult> {
  return checkLimit('vote', userId, 100, 60 * 60)
}

/** API general: 100 requests por IP por minuto */
export function rateLimitGeneral(ip: string): Promise<RateLimitResult> {
  return checkLimit('general', ip, 100, 60)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
