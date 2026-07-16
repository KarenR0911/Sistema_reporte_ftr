-- ============================================================
-- Migración de seguridad: eliminar password de perfiles,
-- integrar con auth.users, y corregir RLS policies
-- ============================================================

-- 1. ELIMINAR COLUMNA PASSWORD DE PERFILES
ALTER TABLE perfiles DROP COLUMN IF EXISTS password;

-- 2. ELIMINAR POLÍTICAS ANON EXISTENTES
DROP POLICY IF EXISTS "Permitir lectura anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir lectura anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir lectura anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir lectura anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir lectura anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir lectura anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir lectura anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir insert anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir insert anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir insert anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir insert anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir insert anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir insert anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir insert anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir update anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir update anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir update anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir update anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir update anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir delete anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir delete anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir delete anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir delete anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir delete anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir delete anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir delete anon perfiles" ON perfiles;

-- 3. NUEVAS POLÍTICAS RLS BASADAS EN auth.uid()

-- Helper: el usuario autenticado es director o administrador
CREATE OR REPLACE FUNCTION public.is_admin_or_director()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('director', 'administrador')
    AND activo = true
  );
END;
$$;

-- ==========================================
-- PERFILES
-- ==========================================
CREATE POLICY "perfiles_select_own_or_admin" ON perfiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin_or_director()
  );

CREATE POLICY "perfiles_insert_trigger_or_admin" ON perfiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin_or_director()
  );

CREATE POLICY "perfiles_update_own_or_admin" ON perfiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin_or_director()
  );

CREATE POLICY "perfiles_delete_admin_only" ON perfiles
  FOR DELETE USING (
    public.is_admin_or_director()
  );

-- ==========================================
-- MISIONES
-- ==========================================
CREATE POLICY "misiones_select_auth" ON misiones
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "misiones_insert_auth" ON misiones
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "misiones_update_auth" ON misiones
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "misiones_delete_admin_only" ON misiones
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- INSUMOS
-- ==========================================
CREATE POLICY "insumos_select_auth" ON insumos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "insumos_insert_auth" ON insumos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "insumos_update_auth" ON insumos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "insumos_delete_admin_only" ON insumos
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- TRANSPORTE
-- ==========================================
CREATE POLICY "transporte_select_auth" ON transporte
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transporte_insert_auth" ON transporte
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transporte_update_auth" ON transporte
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "transporte_delete_admin_only" ON transporte
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- PERSONAL_MISION
-- ==========================================
CREATE POLICY "personal_mision_select_auth" ON personal_mision
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "personal_mision_insert_auth" ON personal_mision
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "personal_mision_update_auth" ON personal_mision
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "personal_mision_delete_admin_only" ON personal_mision
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- ATENDIDOS
-- ==========================================
CREATE POLICY "atendidos_select_auth" ON atendidos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "atendidos_insert_auth" ON atendidos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "atendidos_update_auth" ON atendidos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "atendidos_delete_admin_only" ON atendidos
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- NECESIDADES
-- ==========================================
CREATE POLICY "necesidades_select_auth" ON necesidades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "necesidades_insert_auth" ON necesidades
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "necesidades_update_auth" ON necesidades
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "necesidades_delete_admin_only" ON necesidades
  FOR DELETE USING (public.is_admin_or_director());

-- ==========================================
-- ACTUALIZAR TRIGGER handle_new_user para incluir todos los campos
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.perfiles (id, cedula, nombre, rol, categoria_voluntariado, especialidad, area_voluntariado, email, activo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cedula', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'personal'),
    (NEW.raw_user_meta_data->>'categoria_voluntariado')::categoria_voluntariado,
    COALESCE(NEW.raw_user_meta_data->>'especialidad', ''),
    COALESCE(NEW.raw_user_meta_data->>'area_voluntariado', ''),
    NEW.email,
    true
  );
  RETURN NEW;
END;
$$;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
