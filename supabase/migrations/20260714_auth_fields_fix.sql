-- ============================================================
-- Corrección de campos faltantes en auth.users para usuarios
-- creados mediante INSERT directo en la tabla (en lugar de usar
-- la API de Supabase Auth). También se añade trigger para auto-poblar
-- estos campos en futuros inserts.
-- ============================================================

-- 1. CORREGIR USUARIOS EXISTENTES
-- Los campos aud, role, raw_app_meta_data, is_super_admin deben estar
-- poblados para que Supabase Auth pueda validar inicios de sesión.
UPDATE auth.users
SET
  aud = CASE WHEN aud IS NULL THEN 'authenticated' ELSE aud END,
  role = CASE WHEN role IS NULL THEN 'authenticated' ELSE role END,
  raw_app_meta_data = CASE WHEN raw_app_meta_data IS NULL THEN jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')) ELSE raw_app_meta_data END,
  is_super_admin = CASE WHEN is_super_admin IS NULL THEN false ELSE is_super_admin END
WHERE aud IS NULL
   OR role IS NULL
   OR raw_app_meta_data IS NULL
   OR is_super_admin IS NULL;

-- 2. FUNCIÓN DE TRIGGER PARA AUTO-POBLAR CAMPOS EN NUEVOS INSERT
-- Esto asegura que si alguien inserta un usuario directamente en auth.users
-- (para seeds o migraciones), los campos obligatorios se llenen automáticamente.
CREATE OR REPLACE FUNCTION public.auto_fill_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.aud IS NULL THEN
    NEW.aud := 'authenticated';
  END IF;
  IF NEW.role IS NULL THEN
    NEW.role := 'authenticated';
  END IF;
  IF NEW.raw_app_meta_data IS NULL THEN
    NEW.raw_app_meta_data := jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'));
  END IF;
  IF NEW.is_super_admin IS NULL THEN
    NEW.is_super_admin := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_fill_auth_user ON auth.users;
CREATE TRIGGER trg_auto_fill_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_auth_user();
