-- =============================================================================
-- 003_user_blocks.sql
--
-- Tabla de bloqueos bidireccionales. Si A bloquea a B se crea una fila
-- (blocker_id=A, blocked_id=B). El filtrado en queries se hace en ambas
-- direcciones (ver src/lib/blocks.ts).
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_blocks_no_self  CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique   UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks (blocked_id);
