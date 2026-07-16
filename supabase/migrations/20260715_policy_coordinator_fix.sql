-- ============================================================
-- Agregar helper y política RLS para que coordinadores puedan
-- leer perfiles (necesario para asignar personal a misiones)
-- ============================================================

-- 1. HELPER: usuario autenticado es coordinador o superior
CREATE OR REPLACE FUNCTION public.is_coordinator_or_above()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('director', 'administrador', 'coordinador')
    AND activo = true
  );
END;
$$;

-- 2. ACTUALIZAR POLÍTICA SELECT DE PERFILES para incluir coordinadores
-- Primeo eliminar las políticas existentes
DROP POLICY IF EXISTS "perfiles_select_own_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_own_or_admin_or_coordinator" ON perfiles;

-- Crear nueva política que también permite a coordinadores leer
CREATE POLICY "perfiles_select_own_or_admin_or_coordinator" ON perfiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin_or_director() OR
    public.is_coordinator_or_above()
  );

-- 3. También actualizar is_admin_or_director para que no haga referencia cíclica
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
