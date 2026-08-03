-- ============================================================
-- RLS Policies v2: stricter, role-based, no anonymous access
-- Replaces the previous per-table policies
-- ============================================================

-- 1. Drop all existing policies (old anon + current auth-based)

-- PERFILES
DROP POLICY IF EXISTS "Permitir lectura anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir insert anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir update anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir delete anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_own_or_admin_or_coordinator" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_trigger_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete_admin_only" ON perfiles;

-- MISIONES
DROP POLICY IF EXISTS "Permitir lectura anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir insert anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir update anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir delete anon misiones" ON misiones;
DROP POLICY IF EXISTS "misiones_select_auth" ON misiones;
DROP POLICY IF EXISTS "misiones_insert_auth" ON misiones;
DROP POLICY IF EXISTS "misiones_update_auth" ON misiones;
DROP POLICY IF EXISTS "misiones_delete_admin_only" ON misiones;

-- INSUMOS
DROP POLICY IF EXISTS "Permitir lectura anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir insert anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir update anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir delete anon insumos" ON insumos;
DROP POLICY IF EXISTS "insumos_select_auth" ON insumos;
DROP POLICY IF EXISTS "insumos_insert_auth" ON insumos;
DROP POLICY IF EXISTS "insumos_update_auth" ON insumos;
DROP POLICY IF EXISTS "insumos_delete_admin_only" ON insumos;

-- TRANSPORTE
DROP POLICY IF EXISTS "Permitir lectura anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir insert anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir update anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir delete anon transporte" ON transporte;
DROP POLICY IF EXISTS "transporte_select_auth" ON transporte;
DROP POLICY IF EXISTS "transporte_insert_auth" ON transporte;
DROP POLICY IF EXISTS "transporte_update_auth" ON transporte;
DROP POLICY IF EXISTS "transporte_delete_admin_only" ON transporte;

-- PERSONAL_MISION
DROP POLICY IF EXISTS "Permitir lectura anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir insert anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir update anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir delete anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "personal_mision_select_auth" ON personal_mision;
DROP POLICY IF EXISTS "personal_mision_insert_auth" ON personal_mision;
DROP POLICY IF EXISTS "personal_mision_update_auth" ON personal_mision;
DROP POLICY IF EXISTS "personal_mision_delete_admin_only" ON personal_mision;

-- ATENDIDOS
DROP POLICY IF EXISTS "Permitir lectura anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir insert anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir update anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir delete anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "atendidos_select_auth" ON atendidos;
DROP POLICY IF EXISTS "atendidos_insert_auth" ON atendidos;
DROP POLICY IF EXISTS "atendidos_update_auth" ON atendidos;
DROP POLICY IF EXISTS "atendidos_delete_admin_only" ON atendidos;

-- NECESIDADES
DROP POLICY IF EXISTS "Permitir lectura anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir insert anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir delete anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "necesidades_select_auth" ON necesidades;
DROP POLICY IF EXISTS "necesidades_insert_auth" ON necesidades;
DROP POLICY IF EXISTS "necesidades_update_auth" ON necesidades;
DROP POLICY IF EXISTS "necesidades_delete_admin_only" ON necesidades;

-- SALIDAS_INSUMOS
DROP POLICY IF EXISTS "Permitir lectura anon salidas_insumos" ON salidas_insumos;
DROP POLICY IF EXISTS "Permitir insert anon salidas_insumos" ON salidas_insumos;
DROP POLICY IF EXISTS "Permitir update anon salidas_insumos" ON salidas_insumos;
DROP POLICY IF EXISTS "Permitir delete anon salidas_insumos" ON salidas_insumos;
DROP POLICY IF EXISTS "salidas_insumos_select_auth" ON salidas_insumos;
DROP POLICY IF EXISTS "salidas_insumos_insert_auth" ON salidas_insumos;
DROP POLICY IF EXISTS "salidas_insumos_delete_admin_only" ON salidas_insumos;

-- 2. Create new stricter policies

-- PERFILES: solo autenticados leen, dueño actualiza, solo director elimina
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_delete_director" ON perfiles FOR DELETE USING (get_user_role() = 'director');

-- MISIONES: autenticados CRUD, DELETE solo director/administrador
CREATE POLICY "misiones_select" ON misiones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_insert" ON misiones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_update" ON misiones FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_delete" ON misiones FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- INSUMOS
CREATE POLICY "insumos_select" ON insumos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_insert" ON insumos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_update" ON insumos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_delete" ON insumos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- TRANSPORTE
CREATE POLICY "transporte_select" ON transporte FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_insert" ON transporte FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_update" ON transporte FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_delete" ON transporte FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- PERSONAL_MISION
CREATE POLICY "personal_mision_select" ON personal_mision FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_insert" ON personal_mision FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_update" ON personal_mision FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_delete" ON personal_mision FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- ATENDIDOS
CREATE POLICY "atendidos_select" ON atendidos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_insert" ON atendidos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_update" ON atendidos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_delete" ON atendidos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- NECESIDADES
CREATE POLICY "necesidades_select" ON necesidades FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_insert" ON necesidades FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_update" ON necesidades FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_delete" ON necesidades FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- SALIDAS_INSUMOS
CREATE POLICY "salidas_insumos_select" ON salidas_insumos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_insert" ON salidas_insumos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_update" ON salidas_insumos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_delete" ON salidas_insumos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));
