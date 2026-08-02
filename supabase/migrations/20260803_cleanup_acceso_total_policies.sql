-- ============================================================
-- Limpieza de políticas manuales 'Acceso total' que anulaban el RLS
-- Estas políticas (PERMISSIVE, expr=true) fueron creadas fuera de las
-- migraciones y permitían a cualquier usuario autenticado hacer
-- cualquier operación en la tabla, invalidando las políticas finas.
-- ============================================================

-- 1. Eliminar políticas salvajes
DROP POLICY IF EXISTS "Acceso total perfiles" ON perfiles;
DROP POLICY IF EXISTS "Acceso total insumos" ON insumos;
DROP POLICY IF EXISTS "Acceso total transporte" ON transporte;
DROP POLICY IF EXISTS "Acceso total personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Acceso total necesidades" ON necesidades;

-- 2. PERFILES: director/administrador gestionan usuarios (UsuariosView)
--    manteniendo lectura para autenticados, edición propia del dueño y
--    borrado solo para director.
CREATE POLICY "perfiles_insert_admin" ON perfiles
  FOR INSERT WITH CHECK (public.is_admin_or_director());
CREATE POLICY "perfiles_update_admin" ON perfiles
  FOR UPDATE USING (public.is_admin_or_director());

-- 3. PERSONAL_MISION: el coordinador también puede quitar personal de la
--    misión (UI 'Quitar' visible con canEdit), no solo director/administrador.
DROP POLICY IF EXISTS "personal_mision_delete" ON personal_mision;
CREATE POLICY "personal_mision_delete" ON personal_mision
  FOR DELETE USING (public.is_coordinator_or_above());
