-- ============================================================
-- Restringir INSERT en atendidos: solo personal asignado a la misión
-- Impide que un usuario removido de personal_mision registre atenciones
-- ============================================================

-- Helper: cédula del usuario autenticado (para validar membresía en personal_mision)
CREATE OR REPLACE FUNCTION public.get_user_cedula()
RETURNS text
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT cedula FROM perfiles WHERE id = auth.uid()
$$;

-- Quitar políticas permisivas existentes sobre atendidos
DROP POLICY IF EXISTS "Acceso total atendidos" ON atendidos;
DROP POLICY IF EXISTS "atendidos_insert" ON atendidos;

-- INSERT permitido si:
--   - el usuario es director/administrador/coordinador, o
--   - la cédula del registro coincide con la del usuario autenticado
--     Y existe una asignación en personal_mision para esa misión
CREATE POLICY "atendidos_insert_membresia" ON atendidos
FOR INSERT TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    get_user_role() IN ('director', 'administrador', 'coordinador')
    OR (
      atendidos.cedula_personal = get_user_cedula()
      AND EXISTS (
        SELECT 1 FROM personal_mision pm
        WHERE pm.id_mision = atendidos.id_mision
          AND pm.cedula = get_user_cedula()
      )
    )
  )
);
