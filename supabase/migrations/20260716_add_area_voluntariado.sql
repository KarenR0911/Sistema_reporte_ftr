-- ============================================================
-- Agregar columna area_voluntariado a personal_mision
-- para coincidir con el schema del frontend
-- ============================================================

ALTER TABLE personal_mision ADD COLUMN IF NOT EXISTS area_voluntariado TEXT DEFAULT '';
