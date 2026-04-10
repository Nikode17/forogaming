/**
 * Cliente IGDB (Internet Game Database) via Twitch OAuth.
 * Documentación: https://api-docs.igdb.com
 *
 * El access token dura ~60 días. Se cachea en memoria (module-level)
 * para reutilizarlo entre invocaciones dentro del mismo proceso serverless.
 */

export interface IGDBGame {
  id: number
  name: string
  slug: string
  summary?: string
  cover?: { image_id: string }
  genres?: { name: string }[]
  first_release_date?: number // Unix timestamp
}

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) {
    throw new Error(`Twitch token error: ${res.status}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5 min de margen
  }

  return tokenCache.token
}

/**
 * Busca juegos en IGDB por nombre.
 * Devuelve hasta `limit` resultados con portada, géneros y resumen.
 */
export async function searchIGDBGames(query: string, limit = 8): Promise<IGDBGame[]> {
  const token = await getAccessToken()

  // Escapar comillas en la query para evitar inyección en Apicalypse
  const safeQuery = query.replace(/"/g, '\\"')

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `search "${safeQuery}"; fields name, slug, summary, cover.image_id, genres.name, first_release_date; limit ${limit};`,
  })

  if (!res.ok) {
    throw new Error(`IGDB error: ${res.status}`)
  }

  return res.json() as Promise<IGDBGame[]>
}

/** Construye la URL de portada de IGDB a partir del image_id. */
export function igdbCoverUrl(imageId: string, size: 'cover_big' | 'cover_small' | '720p' = 'cover_big'): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

export interface IGDBGameDetails {
  id: number
  name: string
  slug: string
  summary?: string
  cover?: { image_id: string }
  screenshots?: { image_id: string }[]
  genres?: { name: string }[]
  platforms?: { name: string }[]
  involved_companies?: { developer: boolean; company: { name: string } }[]
  first_release_date?: number
  total_rating?: number
  total_rating_count?: number
}

/**
 * Obtiene datos enriquecidos de un juego por nombre exacto.
 * Usado en la página de juego para mostrar info rica de IGDB.
 */
export async function getIGDBGameDetails(name: string): Promise<IGDBGameDetails | null> {
  const token = await getAccessToken()
  const safeName = name.replace(/"/g, '\\"')

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `
      fields name, slug, summary, cover.image_id,
             screenshots.image_id, genres.name, platforms.name,
             involved_companies.developer, involved_companies.company.name,
             first_release_date, total_rating, total_rating_count;
      where name = "${safeName}";
      limit 1;
    `,
    next: { revalidate: 86400 }, // cachear 24h
  } as RequestInit)

  if (!res.ok) return null

  const data = await res.json() as IGDBGameDetails[]
  return data[0] ?? null
}
