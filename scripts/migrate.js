#!/usr/bin/env node
// scripts/migrate.js
//
// Runner de migraciones idempotente. Escanea migrations/*.sql en orden
// alfabético, compara con la tabla schema_migrations, y aplica las pendientes
// envueltas en transacción individual.
//
// Uso: node --env-file=.env.local scripts/migrate.js
//      node scripts/migrate.js (si DATABASE_URL ya está en el entorno)

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Fallback: si no se pasó --env-file y existe .env.local, cargarlo a mano.
// (Mantenemos esto para compatibilidad con quien ejecute sin el flag.)
function loadEnvLocalIfMissing() {
  if (process.env.DATABASE_URL) return
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
  console.log('[migrate] .env.local cargado como fallback')
}

async function ensureSchemaMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedSet(pool) {
  const res = await pool.query('SELECT filename FROM schema_migrations')
  return new Set(res.rows.map((r) => r.filename))
}

function listMigrationFiles() {
  const dir = path.join(__dirname, '..', 'migrations')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort() // alfabético — naming NNN_xxx asegura orden correcto
}

async function applyMigration(pool, filename) {
  const sqlPath = path.join(__dirname, '..', 'migrations', filename)
  const sql = fs.readFileSync(sqlPath, 'utf8')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    )
    await client.query('COMMIT')
    console.log(`[migrate] OK ${filename}`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw new Error(`Migración ${filename} falló: ${err.message}`)
  } finally {
    client.release()
  }
}

;(async () => {
  loadEnvLocalIfMissing()

  if (!process.env.DATABASE_URL) {
    console.error('[migrate] ERROR: DATABASE_URL no está configurada')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await ensureSchemaMigrationsTable(pool)
    const applied = await getAppliedSet(pool)
    const onDisk = listMigrationFiles()

    if (onDisk.length === 0) {
      console.log('[migrate] No hay archivos .sql en migrations/')
      return
    }

    const pending = onDisk.filter((f) => !applied.has(f))
    const orphans = [...applied].filter((f) => !onDisk.includes(f))

    if (orphans.length > 0) {
      console.log(`[migrate] Aplicadas en BD pero no en disco (ignoradas): ${orphans.join(', ')}`)
    }

    if (pending.length === 0) {
      console.log('[migrate] Sin migraciones pendientes — todo al día.')
      return
    }

    console.log(`[migrate] Aplicando ${pending.length} migración(es):`)
    for (const filename of pending) {
      await applyMigration(pool, filename)
    }
    console.log(`[migrate] ✅ ${pending.length} migración(es) aplicada(s).`)
  } catch (err) {
    console.error(`[migrate] ❌ ${err.message}`)
    process.exit(1)
  } finally {
    await pool.end()
  }
})()
