-- ============================================================
-- Security fix: handle_new_user forces rol='personal'
-- Prevents privilege escalation from client-side signup metadata
-- The admin panel will override the role via an upsert after signup
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
    'personal',
    (NEW.raw_user_meta_data->>'categoria_voluntariado')::public.categoria_voluntariado,
    COALESCE(NEW.raw_user_meta_data->>'especialidad', ''),
    COALESCE(NEW.raw_user_meta_data->>'area_voluntariado', ''),
    true
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
