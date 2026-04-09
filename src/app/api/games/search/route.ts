import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { searchIGDBGames, igdbCoverUrl } from '@/lib/igdb'
import slugify from 'slugify'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

/**
 * GET /api/games/search?q=elden+ring
 *
 * Busca juegos en IGDB y devuelve los resultados enriquecidos.
 * Los juegos seleccionados se guardan en nuestra DB vía POST /api/games/select.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return err('VALIDATION_ERROR', 'El término de búsqueda debe tener al menos 2 caracteres', 422)
  }

  if (q.length > 100) {
    return err('VALIDATION_ERROR', 'Búsqueda demasiado larga', 422)
  }

  try {
    const igdbGames = await searchIGDBGames(q)

    const results = igdbGames.map((g) => ({
      igdb_id: g.id,
      name: g.name,
      slug: slugify(g.name, { lower: true, strict: true }),
      cover_url: g.cover?.image_id ? igdbCoverUrl(g.cover.image_id) : null,
      summary: g.summary ?? null,
      genres: g.genres?.map((x) => x.name) ?? [],
      year: g.first_release_date
        ? new Date(g.first_release_date * 1000).getFullYear()
        : null,
    }))

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('[IGDB Search Error]', error)
    return err('INTERNAL_ERROR', 'Error al buscar juegos', 500)
  }
}

/**
 * POST /api/games/search
 * Body: { igdb_id, name, slug, cover_url, summary }
 *
 * Guarda (upsert) el juego en nuestra DB y devuelve el UUID local.
 * Se llama cuando el usuario selecciona un juego del buscador.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('VALIDATION_ERROR', 'Body inválido', 422)
  }

  const { igdb_id, name, cover_url, summary } = body as {
    igdb_id: number
    name: string
    cover_url: string | null
    summary: string | null
  }

  if (!igdb_id || !name) {
    return err('VALIDATION_ERROR', 'Faltan campos requeridos', 422)
  }

  const slug = slugify(name, { lower: true, strict: true })

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO games (id, name, slug, cover_url, description)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE
         SET cover_url   = COALESCE(EXCLUDED.cover_url, games.cover_url),
             description = COALESCE(EXCLUDED.description, games.description)
       RETURNING id`,
      [name, slug, cover_url, summary]
    )

    return NextResponse.json({ id: result.rows[0].id, slug })
  } catch (error) {
    console.error('[IGDB Upsert Error]', error)
    return err('INTERNAL_ERROR', 'Error al guardar el juego', 500)
  }
}
