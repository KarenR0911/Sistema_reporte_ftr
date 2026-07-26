-- Eliminar columna estatus_cargamento y su tipo enum
-- Ya no se usa: todo insumo se creaba como 'entregado' y nunca cambiaba.
-- El reemplazo es el sistema de dispensación (salidas_insumos).

ALTER TABLE insumos DROP COLUMN IF EXISTS estatus_cargamento;
DROP TYPE IF EXISTS estatus_cargamento;
