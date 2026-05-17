-- =============================================================================
-- 002_friends_messages.sql
--
-- Reconstruye en local el shape EXACTO de producción para las tablas que
-- viven sólo en prod (aplicadas históricamente vía SQL editor de Neon):
--   · direct_messages
--   · friend_requests
--   · users.last_seen (columna añadida)
--
-- Idempotente: IF NOT EXISTS en tablas, índices y columna. CHECK constraints
-- y UNIQUE viven inline en el CREATE TABLE, por lo que sólo se aplican
-- cuando la tabla no existía. Si la tabla ya está (caso prod), no se toca.
-- =============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- direct_messages
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL CONSTRAINT direct_messages_body_check CHECK (char_length(body) <= 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_sender   ON direct_messages (sender_id,   created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- friend_requests
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friend_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending'
              CONSTRAINT friend_requests_status_check
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_fr_receiver ON friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_fr_sender   ON friend_requests (sender_id,   status);

-- ────────────────────────────────────────────────────────────────────────────
-- users.last_seen
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
