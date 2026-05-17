-- =============================================================================
-- 004_follows.sql
--
-- Reproduce en local el shape EXACTO de producción para la tabla follows
-- (creada históricamente vía SQL editor de Neon, ausente de las migraciones
-- del repo). Idempotente: si la tabla ya existe, no se toca.
--
-- Relación follower → following con PK compuesta (no hay columna id).
-- =============================================================================

CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL CONSTRAINT follows_follower_id_fkey  REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL CONSTRAINT follows_following_id_fkey REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);
