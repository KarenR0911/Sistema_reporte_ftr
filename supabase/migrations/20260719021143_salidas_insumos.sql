-- Tabla salidas_insumos: registro de salidas de inventario dentro de una misión
-- Independiente de atenciones (no necesariamente atada a una persona)

CREATE TABLE IF NOT EXISTS salidas_insumos (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  id_insumo UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT DEFAULT '',
  registrado_por TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE salidas_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salidas_insumos_select_auth" ON salidas_insumos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "salidas_insumos_insert_auth" ON salidas_insumos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "salidas_insumos_delete_admin_only" ON salidas_insumos
  FOR DELETE USING (public.is_admin_or_director());

CREATE INDEX IF NOT EXISTS idx_salidas_insumos_mision ON salidas_insumos(id_mision);
CREATE INDEX IF NOT EXISTS idx_salidas_insumos_insumo ON salidas_insumos(id_insumo);
