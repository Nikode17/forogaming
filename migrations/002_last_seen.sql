-- Migration 002: add last_seen to users for online presence indicator
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
