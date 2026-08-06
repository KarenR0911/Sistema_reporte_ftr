-- ============================================================
-- Logs del sistema (auditoría)
-- Registra las acciones de cada usuario (CRUD + gestión de
-- usuarios + login/logout). Solo visible para director y
-- administrador; append-only (sin UPDATE/DELETE desde la app).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.registro_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  usuario_cedula text,
  usuario_nombre text,
  usuario_rol text,
  entidad text NOT NULL,
  accion text NOT NULL,
  registro_id text,
  resumen text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registro_logs_created_at ON public.registro_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registro_logs_usuario ON public.registro_logs (usuario_id);
CREATE INDEX IF NOT EXISTS idx_registro_logs_entidad ON public.registro_logs (entidad);

ALTER TABLE public.registro_logs ENABLE ROW LEVEL SECURITY;

-- Solo director/administrador pueden leer los logs
CREATE POLICY "registro_logs_select_admin" ON public.registro_logs
  FOR SELECT USING (public.get_user_role() IN ('director', 'administrador'));

-- Un usuario solo puede insertar logs propios (anti-suplantación)
CREATE POLICY "registro_logs_insert_own" ON public.registro_logs
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Sin políticas UPDATE/DELETE -> append-only (denegado por RLS)
