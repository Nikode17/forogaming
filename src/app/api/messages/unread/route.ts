import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return NextResponse.json({ count: 0 })

  const result = await query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM direct_messages WHERE receiver_id = $1 AND read_at IS NULL',
    [id]
  )

  return NextResponse.json({ count: Number(result.rows[0]?.count ?? 0) })
}
