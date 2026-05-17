-- =============================================================================
-- 006_reports_columns_indexes.sql
--
-- Extiende la tabla reports para el sistema de moderación completo:
--  · description: texto libre opcional del reportador (complementa reason).
--  · resolved_at, resolved_by: trazabilidad de cuándo y quién cerró el reporte.
--  · updated_at: arregla bug latente en /api/admin/reports/[id] PUT que
--    referenciaba esta columna inexistente.
--  · 2 índices: status (con created_at DESC para listados ordenados) y
--    target (para filtros por tipo).
--
-- Todo idempotente: IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
-- =============================================================================

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved_by UUID
  CONSTRAINT reports_resolved_by_fkey REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, status);
