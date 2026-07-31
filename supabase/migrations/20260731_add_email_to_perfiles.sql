-- ============================================================
-- Re-add email column to perfiles (was dropped in 20260720)
-- Now the admin provides a real email when creating a user
-- instead of fabricating {cedula}@ftr.app
-- ============================================================

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_email_unique ON perfiles (email) WHERE email <> '';

-- Update handle_new_user to store NEW.email in perfiles.email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, cedula, nombre, rol, categoria_voluntariado, especialidad, area_voluntariado, activo)
  VALUES (
    NEW.id,
    NEW.email,
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
