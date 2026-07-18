-- Eliminar status_sync de todas las tablas y del esquema
-- El campo solo se necesita en IndexedDB para tracking offline de atendidos/necesidades

DROP INDEX IF EXISTS idx_misiones_status;

ALTER TABLE misiones        DROP COLUMN IF EXISTS status_sync;
ALTER TABLE insumos         DROP COLUMN IF EXISTS status_sync;
ALTER TABLE transporte      DROP COLUMN IF EXISTS status_sync;
ALTER TABLE personal_mision DROP COLUMN IF EXISTS status_sync;
ALTER TABLE atendidos       DROP COLUMN IF EXISTS status_sync;
ALTER TABLE necesidades     DROP COLUMN IF EXISTS status_sync;

DROP TYPE IF EXISTS status_sync;
