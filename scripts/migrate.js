#!/usr/bin/env node
// scripts/migrate.js
// Uso: node scripts/migrate.js
// Requiere DATABASE_URL en el entorno (o en .env.local)

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Cargar .env.local si existe (para desarrollo local)
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...val] = line.split('=')
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = val.join('=').trim()
      }
    })
    console.log('[migrate] Cargado .env.local')
  }
} catch (e) {
  // ignorar si no existe
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('[migrate] ERROR: DATABASE_URL no está configurada')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    // Tabla de seguimiento de migraciones aplicadas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    const applied = await pool.query('SELECT filename FROM schema_migrations')
    const appliedSet = new Set(applied.rows.map(r => r.filename))

    const migrationsDir = path.join(__dirname, '..', 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrate] ⏭️  ${file} (ya aplicada)`)
        continue
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`[migrate] 🔄 Aplicando ${file}...`)
      await pool.query(sql)
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      console.log(`[migrate] ✅ ${file} completada`)
    }

    console.log('[migrate] ✅ Todas las migraciones al día')
  } catch (error) {
    console.error('[migrate] ❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
