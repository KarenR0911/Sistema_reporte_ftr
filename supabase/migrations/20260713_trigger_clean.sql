-- ============================================================
-- Corrección del trigger handle_new_user con tipos fully qualified
-- y limpieza de datos seed antiguos
-- ============================================================

-- 1. CORREGIR TRIGGER CON TIPOS FULLY QUALIFIED
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
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.rol_usuario, 'personal'::public.rol_usuario),
    (NEW.raw_user_meta_data->>'categoria_voluntariado')::public.categoria_voluntariado,
    COALESCE(NEW.raw_user_meta_data->>'especialidad', ''),
    COALESCE(NEW.raw_user_meta_data->>'area_voluntariado', ''),
    NEW.email,
    true
  );
  RETURN NEW;
END;
$$;

-- 2. LIMPIAR DATOS SEED ANTIGUOS
-- Se eliminan todas las misiones seed (CASCADE elimina insumos, transporte,
-- personal_mision, atendidos y necesidades automáticamente)
DELETE FROM misiones;

-- Eliminar perfiles seed antiguos (solo conservar los 4 usuarios básicos)
DELETE FROM perfiles WHERE email NOT IN ('0001@ftr.app', '0002@ftr.app', '0003@ftr.app', '0004@ftr.app');

-- Eliminar usuarios seed antiguos de auth.users
DELETE FROM auth.users WHERE email NOT IN ('0001@ftr.app', '0002@ftr.app', '0003@ftr.app', '0004@ftr.app');
