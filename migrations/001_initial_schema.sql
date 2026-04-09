-- =====================
-- Migración 001: Esquema inicial de Forogaming
-- =====================

-- Crear extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- TIPOS ENUM
-- =====================
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user', 'guest');
CREATE TYPE post_category AS ENUM ('guide', 'easter-egg', 'review', 'general');
CREATE TYPE media_type AS ENUM ('image', 'video_embed');
CREATE TYPE vote_target AS ENUM ('post', 'comment');
CREATE TYPE like_target AS ENUM ('post', 'comment');
CREATE TYPE report_target AS ENUM ('post', 'comment', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- =====================
-- TABLA: users
-- =====================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  avatar_url    TEXT,
  bio           TEXT,
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: games
-- =====================
CREATE TABLE games (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  cover_url   TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: posts
-- =====================
CREATE TABLE posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,
  category     post_category NOT NULL,
  game_id      UUID REFERENCES games(id) ON DELETE SET NULL,
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: post_media
-- =====================
CREATE TABLE post_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type       media_type NOT NULL,
  url        TEXT NOT NULL,
  position   INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: post_steps
-- =====================
CREATE TABLE post_steps (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  step_num  INTEGER NOT NULL,
  title     VARCHAR(255),
  body      TEXT NOT NULL,
  image_url TEXT,
  UNIQUE(post_id, step_num)
);

-- =====================
-- TABLA: comments
-- =====================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: votes
-- =====================
CREATE TABLE votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type vote_target NOT NULL,
  target_id   UUID NOT NULL,
  value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- =====================
-- TABLA: likes
-- =====================
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type like_target NOT NULL,
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- =====================
-- TABLA: favorites
-- =====================
CREATE TABLE favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- =====================
-- TABLA: reports
-- =====================
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type report_target NOT NULL,
  target_id   UUID NOT NULL,
  reason      TEXT,
  status      report_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLA: revoked_tokens
-- (para invalidar refresh tokens en logout)
-- =====================
CREATE TABLE revoked_tokens (
  jti        VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- =====================
-- INDICES
-- =====================
CREATE INDEX idx_posts_game_id     ON posts(game_id);
CREATE INDEX idx_posts_category    ON posts(category);
CREATE INDEX idx_posts_author_id   ON posts(author_id);
CREATE INDEX idx_posts_created_at  ON posts(created_at DESC);
CREATE INDEX idx_posts_published   ON posts(is_published, is_deleted);
CREATE INDEX idx_comments_post_id  ON comments(post_id);
CREATE INDEX idx_comments_parent   ON comments(parent_id);
CREATE INDEX idx_votes_target      ON votes(target_type, target_id);
CREATE INDEX idx_likes_target      ON likes(target_type, target_id);
CREATE INDEX idx_revoked_tokens_exp ON revoked_tokens(expires_at);

-- =====================
-- FUNCION: updated_at automatico
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- VISTA: post_scores (para trending)
-- Algoritmo tipo Reddit: score = (upvotes - downvotes) / (age_hours + 2)^1.8
-- =====================
CREATE OR REPLACE VIEW post_scores AS
SELECT
  p.id,
  p.title,
  p.category,
  p.game_id,
  p.author_id,
  p.created_at,
  COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
  COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
  COALESCE(SUM(v.value), 0) AS net_votes,
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 AS age_hours,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2 > 0
    THEN COALESCE(SUM(v.value), 0)::FLOAT /
         POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.8)
    ELSE 0
  END AS trending_score
FROM posts p
LEFT JOIN votes v ON v.target_type = 'post' AND v.target_id = p.id
WHERE p.is_deleted = FALSE AND p.is_published = TRUE
GROUP BY p.id;
