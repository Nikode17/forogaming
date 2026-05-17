import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { excludeBlockedSql } from '@/lib/blocks'

// GET /api/users/search?q=username
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const myId = req.headers.get('x-user-id')

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  // Params order: $1 = pattern, $2 = myId (si logueado, también usado por
  // excludeBlockedSql). Excluimos también al propio usuario de los resultados.
  const sqlParts: string[] = [
    `SELECT id, username, avatar_url, role
     FROM users
     WHERE username ILIKE $1
       AND is_banned = FALSE`,
  ]
  const params: unknown[] = [`%${q}%`]

  if (myId) {
    params.push(myId)
    sqlParts.push(`AND id != $2`)
    sqlParts.push(`AND ${excludeBlockedSql('id', '$2')}`)
  }

  sqlParts.push(`ORDER BY username ASC LIMIT 10`)

  const result = await query<{
    id: string
    username: string
    avatar_url: string | null
    role: string
  }>(sqlParts.join(' '), params)

  return NextResponse.json({ data: result.rows })
}
