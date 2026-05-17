import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { excludeBlockedSql } from '@/lib/blocks'

export async function GET(req: NextRequest) {
  const id = req.headers.get('x-user-id')
  if (!id) return NextResponse.json({ count: 0 })

  // Excluir del contador los mensajes cuyo sender esté en relación de bloqueo.
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM direct_messages
     WHERE receiver_id = $1
       AND read_at IS NULL
       AND ${excludeBlockedSql('sender_id', '$1')}`,
    [id]
  )

  return NextResponse.json({ count: Number(result.rows[0]?.count ?? 0) })
}
