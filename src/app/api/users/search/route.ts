import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/users/search?q=username
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const myId = req.headers.get('x-user-id')

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const result = await query<{
    id: string
    username: string
    avatar_url: string | null
    role: string
  }>(
    `SELECT id, username, avatar_url, role
     FROM users
     WHERE username ILIKE $1
       AND is_banned = FALSE
       ${myId ? 'AND id != $2' : ''}
     ORDER BY username ASC
     LIMIT 10`,
    myId ? [`%${q}%`, myId] : [`%${q}%`]
  )

  return NextResponse.json({ data: result.rows })
}
