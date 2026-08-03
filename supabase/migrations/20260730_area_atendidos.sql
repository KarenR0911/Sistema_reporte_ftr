-- Agregar campos por área a la tabla atendidos
-- Cada área (medicina, psicología, veterinaria, logística) tiene campos específicos

ALTER TABLE atendidos
  ADD COLUMN IF NOT EXISTS area_registro TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS lugar_vivia TEXT,
  ADD COLUMN IF NOT EXISTS lugar_actual TEXT,
  ADD COLUMN IF NOT EXISTS motivo_atencion TEXT,
  ADD COLUMN IF NOT EXISTS insumo_entregado TEXT,
  ADD COLUMN IF NOT EXISTS especie TEXT,
  ADD COLUMN IF NOT EXISTS posee_tutor BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rescatado BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS en_adopcion BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diagnostico_tentativo TEXT;
