-- =============================================================================
-- 005_reports_add_message_target.sql
--
-- Añade el valor 'message' al ENUM report_target. EN MIGRACIÓN SEPARADA
-- (sin tocar otras estructuras) porque algunas versiones de Postgres no
-- permiten USAR el valor recién añadido en la misma transacción donde se
-- añade. El runner aplica cada archivo en su propia tx, así que aislarlo
-- aquí garantiza que la 006 (que crea columnas) y cualquier futura
-- migración pueda usar 'message' sin riesgo.
--
-- IF NOT EXISTS lo hace idempotente.
-- =============================================================================

ALTER TYPE report_target ADD VALUE IF NOT EXISTS 'message';
