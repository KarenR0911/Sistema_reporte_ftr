-- Helper function for RLS: returns the role of the currently authenticated user
-- Used by policies to restrict DELETE/UPDATE based on user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.rol_usuario
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid()
$$;
