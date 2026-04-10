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
    const sqlPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('[migrate] Ejecutando migración 001_initial_schema.sql...')
    await pool.query(sql)
    console.log('[migrate] ✅ Migración completada exitosamente')
  } catch (error) {
    console.error('[migrate] ❌ Error ejecutando migración:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
