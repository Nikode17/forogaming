import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId])
  return NextResponse.json({ ok: true })
}
