-- Alinear tabla atendidos al WHO Emergency Medical Team Minimum Data Set (MDS)
-- Se agregan campos estándar internacionales y se elimina insumos_dados
-- (los insumos los gestiona exclusivamente el rol Admin/Coord)

ALTER TABLE atendidos
  ADD COLUMN IF NOT EXISTS edad INT,
  ADD COLUMN IF NOT EXISTS sexo TEXT,
  ADD COLUMN IF NOT EXISTS tipo_atencion TEXT,
  ADD COLUMN IF NOT EXISTS referido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vulnerabilidad TEXT NOT NULL DEFAULT '[]';

ALTER TABLE atendidos
  DROP COLUMN IF EXISTS insumos_dados;
