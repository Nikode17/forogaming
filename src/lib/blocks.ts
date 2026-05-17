/**
 * Bloqueos bidireccionales entre usuarios.
 *
 * Modelo: tabla user_blocks (blocker_id, blocked_id). Una sola fila por
 * dirección. Si A bloquea a B → fila (A, B). Si quieres saber si A y B
 * tienen CUALQUIER relación de bloqueo, hay que mirar ambas direcciones.
 *
 * Patrón de filtrado en queries: prepender al SQL del caller un fragmento
 * `excludeBlocked(...)` que se evalúa contra una expresión que represente
 * al "otro usuario" en cada fila (typically `p.author_id` en posts,
 * `u.id` en listados de users, etc.).
 *
 * TODO Fase 4c: cuando exista sistema de notificaciones, aplicar el mismo
 * filtro al feed de notifications. Por ahora no hay tabla.
 */

import { query } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Filtros SQL para queries de listado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera el fragmento SQL `<otherIdExpr> NOT IN (...)` que excluye usuarios
 * con los que `me` tenga relación de bloqueo en cualquier dirección.
 *
 * Importante: el caller controla el número de parámetro para `myId`
 * (`$1`, `$2`, …) para integrarse con su propia numeración.
 *
 * Si `me` es NULL (guest), el subquery devuelve cero filas y `NOT IN` no
 * filtra nada — comportamiento correcto: los anónimos no tienen bloqueos.
 *
 * @example
 *   const sql = `
 *     SELECT * FROM posts p
 *     WHERE p.is_deleted = FALSE
 *       AND ${excludeBlockedSql('p.author_id', '$1')}
 *   `
 *   const result = await query(sql, [myId])
 */
export function excludeBlockedSql(otherIdExpr: string, myIdParam: string): string {
  return `${otherIdExpr} NOT IN (
    SELECT blocked_id FROM user_blocks WHERE blocker_id = ${myIdParam}
    UNION
    SELECT blocker_id FROM user_blocks WHERE blocked_id = ${myIdParam}
  )`
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprobación puntual entre dos usuarios (para decisiones 404 vs 403, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockRelation {
  /** ¿el usuario `me` ha bloqueado a `other`? */
  iBlocked: boolean
  /** ¿el usuario `other` ha bloqueado a `me`? */
  blockedByThem: boolean
}

export const NO_BLOCK: BlockRelation = { iBlocked: false, blockedByThem: false }

/**
 * Resuelve la relación de bloqueo entre dos usuarios. Si `me` es null
 * (guest) devuelve NO_BLOCK sin consultar BD.
 *
 * Devuelve los dos flags por separado para que el caller decida según el
 * contexto (perfil con badge "le bloqueaste" vs 404).
 */
export async function getBlockRelation(
  meId: string | null,
  otherId: string
): Promise<BlockRelation> {
  if (!meId || meId === otherId) return NO_BLOCK

  const result = await query<{ blocker_id: string }>(
    `SELECT blocker_id FROM user_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [meId, otherId]
  )

  if (result.rows.length === 0) return NO_BLOCK

  let iBlocked = false
  let blockedByThem = false
  for (const row of result.rows) {
    if (row.blocker_id === meId) iBlocked = true
    else blockedByThem = true
  }
  return { iBlocked, blockedByThem }
}

/** Atajo: ¿hay bloqueo en cualquier dirección? */
export function hasAnyBlock(rel: BlockRelation): boolean {
  return rel.iBlocked || rel.blockedByThem
}
