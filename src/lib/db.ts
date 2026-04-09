import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg' // QueryResultRow used as constraint

// Singleton pool — reutilizar conexiones entre requests en Next.js
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno')
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                 // máximo de conexiones simultáneas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.APP_ENV === 'production'
      ? { rejectUnauthorized: true }
      : false,
  })
}

// En desarrollo, evitar crear múltiples pools por hot-reload
export const pool: Pool =
  process.env.NODE_ENV === 'development'
    ? (global._pgPool ?? (global._pgPool = createPool()))
    : createPool()

/**
 * Ejecuta una query parametrizada contra la base de datos.
 * Usa $1, $2, ... como placeholders para prevenir SQL injection.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const result = await pool.query<T>(text, params)
  const duration = Date.now() - start

  if (process.env.NODE_ENV === 'development') {
    console.log('[DB]', { query: text.slice(0, 80), duration: `${duration}ms`, rows: result.rowCount })
  }

  return result
}

/**
 * Ejecuta múltiples queries en una transacción.
 * Hace rollback automático si alguna query falla.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Verifica la conectividad con la base de datos.
 * Usado por el endpoint GET /api/health
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}
