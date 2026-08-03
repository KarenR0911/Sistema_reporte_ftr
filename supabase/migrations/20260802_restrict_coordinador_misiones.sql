-- ============================================================
-- Restringir al coordinador: no crear misiones, no completarlas
-- El coordinador gestiona misiones existentes (agregar personal,
-- transporte, levantar necesidades, ver datos), pero solo
-- director/administrador pueden crear, completar y generar
-- reportes/planes. Aquí se refuerza a nivel de base de datos.
-- ============================================================

-- 1. Eliminar política manual 'Acceso total misiones' que anulaba el RLS
--    (creada fuera de las migraciones; permite cualquier comando a cualquiera)
DROP POLICY IF EXISTS "Acceso total misiones" ON misiones;

-- 2. INSERT en misiones: solo director/administrador
DROP POLICY IF EXISTS "misiones_insert" ON misiones;
CREATE POLICY "misiones_insert" ON misiones
  FOR INSERT WITH CHECK (public.is_admin_or_director());

-- 3. Bloquear cambios de estatus (activar->completar) para
--    cualquier rol que no sea director/administrador
CREATE OR REPLACE FUNCTION public.prevent_estatus_mision_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.estatus_mision IS DISTINCT FROM OLD.estatus_mision
     AND NOT public.is_admin_or_director() THEN
    RAISE EXCEPTION 'Solo el director o administrador puede cambiar el estatus de una misión';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_estatus_mision_change ON public.misiones;
CREATE TRIGGER trg_prevent_estatus_mision_change
  BEFORE UPDATE ON public.misiones
  FOR EACH ROW EXECUTE FUNCTION public.prevent_estatus_mision_change();
