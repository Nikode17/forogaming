#!/usr/bin/env node
// Lista los últimos 100 posts. Solo SELECT. No modifica nada.

const { Client } = require('pg')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL no está definida.')
  process.exit(1)
}

const host = new URL(url).host.split(':')[0]
console.log(`Conectando a: ${host}\n`)

;(async () => {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const res = await client.query(`
    SELECT
      p.id,
      p.title,
      p.category,
      u.username AS author,
      p.created_at,
      p.is_deleted,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
      (SELECT COUNT(*) FROM votes WHERE target_type = 'post' AND target_id = p.id) AS vote_count
    FROM posts p
    LEFT JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
    LIMIT 100
  `)

  console.log(`Filas devueltas: ${res.rowCount}\n`)

  const rows = res.rows.map(r => ({
    id: r.id,
    title: (r.title ?? '').slice(0, 28),
    cat: r.category,
    author: r.author,
    created: new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19),
    del: r.is_deleted ? 'YES' : '-',
    c: Number(r.comment_count),
    v: Number(r.vote_count),
  }))
  console.table(rows)

  await client.end()
})().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
