-- ============================================================
-- Fix: handle_new_user trigger insertaba en columna email
-- que fue eliminada en 20260720_remove_email_from_perfiles.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.perfiles (id, cedula, nombre, rol, categoria_voluntariado, especialidad, area_voluntariado, activo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cedula', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.rol_usuario, 'personal'::public.rol_usuario),
    (NEW.raw_user_meta_data->>'categoria_voluntariado')::public.categoria_voluntariado,
    COALESCE(NEW.raw_user_meta_data->>'especialidad', ''),
    COALESCE(NEW.raw_user_meta_data->>'area_voluntariado', ''),
    true
  );
  RETURN NEW;
END;
$$;
