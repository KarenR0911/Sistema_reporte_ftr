-- ============================================================
-- Migración completa para Sistema de Reporte FTR
-- Ejecutar en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nsuskftwonycndueahqd/sql/new
-- ============================================================

-- 1. ENUM TYPES (idempotent)
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('director', 'administrador', 'coordinador', 'personal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estatus_mision AS ENUM ('activa', 'completada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estatus_cargamento AS ENUM ('entregado', 'retorno');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE categoria_voluntariado AS ENUM ('estudiante', 'profesional', 'voluntario');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estatus_necesidad AS ENUM ('reportado', 'enproceso', 'atendido');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_sync AS ENUM ('pending', 'synced');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE PERFILES (usuarios del sistema)
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'personal',
  categoria_voluntariado categoria_voluntariado DEFAULT NULL,
  especialidad TEXT DEFAULT '',
  area_voluntariado TEXT DEFAULT '',
  email TEXT DEFAULT '',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MISIONES
CREATE TABLE IF NOT EXISTS misiones (
  id UUID PRIMARY KEY,
  direccion TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  estatus_mision estatus_mision NOT NULL DEFAULT 'activa',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INSUMOS LLEVADOS
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  unidad TEXT NOT NULL,
  observaciones TEXT DEFAULT '',
  estatus_cargamento estatus_cargamento NOT NULL DEFAULT 'entregado',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TRANSPORTE
CREATE TABLE IF NOT EXISTS transporte (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  tipo_transporte TEXT NOT NULL,
  numero_placa TEXT NOT NULL,
  nombre_conductor TEXT NOT NULL,
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PERSONAL / VOLUNTARIOS POR MISIÓN
CREATE TABLE IF NOT EXISTS personal_mision (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria_voluntariado categoria_voluntariado NOT NULL DEFAULT 'voluntario',
  especialidad TEXT DEFAULT '',
  area_voluntariado TEXT DEFAULT '',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ATENDIDOS
CREATE TABLE IF NOT EXISTS atendidos (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  cedula_personal TEXT NOT NULL,
  cedula_atendido TEXT NOT NULL,
  nombre_atendido TEXT NOT NULL,
  telefono_contacto TEXT DEFAULT '',
  fecha_hora_atencion TIMESTAMPTZ NOT NULL DEFAULT now(),
  notas TEXT DEFAULT '',
  insumos_dados TEXT DEFAULT '',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. NECESIDADES
CREATE TABLE IF NOT EXISTS necesidades (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad_requerida INTEGER NOT NULL,
  unidad TEXT NOT NULL,
  observaciones TEXT DEFAULT '',
  prioridad prioridad NOT NULL DEFAULT 'media',
  estatus estatus_necesidad NOT NULL DEFAULT 'reportado',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. SALIDAS DE INSUMOS (dispensación)
CREATE TABLE IF NOT EXISTS salidas_insumos (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  id_insumo UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  motivo TEXT DEFAULT '',
  registrado_por TEXT NOT NULL,
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_insumos_mision ON insumos(id_mision);
CREATE INDEX IF NOT EXISTS idx_transporte_mision ON transporte(id_mision);
CREATE INDEX IF NOT EXISTS idx_personal_mision ON personal_mision(id_mision);
CREATE INDEX IF NOT EXISTS idx_atendidos_mision ON atendidos(id_mision);
CREATE INDEX IF NOT EXISTS idx_necesidades_mision ON necesidades(id_mision);
CREATE INDEX IF NOT EXISTS idx_salidas_mision ON salidas_insumos(id_mision);
CREATE INDEX IF NOT EXISTS idx_misiones_status ON misiones(status_sync);
CREATE INDEX IF NOT EXISTS idx_perfiles_cedula ON perfiles(cedula);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);

-- 11. HELPER FUNCTION PARA OBTENER ROL DEL USUARIO EN RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.rol_usuario
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid()
$$;

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE misiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_mision ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE salidas_insumos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores permisivas
DROP POLICY IF EXISTS "Permitir lectura anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir lectura anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir lectura anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir lectura anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir lectura anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir lectura anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir lectura anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir insert anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir insert anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir insert anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir insert anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir insert anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir insert anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir insert anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir update anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir update anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir update anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir update anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir update anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir delete anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir delete anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir delete anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir delete anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir delete anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir delete anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir delete anon perfiles" ON perfiles;

-- PERFILES: cualquier autenticado puede leer, solo dueño actualiza, solo director elimina
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_delete_director" ON perfiles FOR DELETE USING (get_user_role() = 'director');

-- MISIONES: autenticados pueden CRUD; DELETE restringido a director/administrador
CREATE POLICY "misiones_select" ON misiones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_insert" ON misiones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_update" ON misiones FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "misiones_delete" ON misiones FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- INSUMOS
CREATE POLICY "insumos_select" ON insumos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_insert" ON insumos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_update" ON insumos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "insumos_delete" ON insumos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- TRANSPORTE
CREATE POLICY "transporte_select" ON transporte FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_insert" ON transporte FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_update" ON transporte FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "transporte_delete" ON transporte FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- PERSONAL_MISION
CREATE POLICY "personal_mision_select" ON personal_mision FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_insert" ON personal_mision FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_update" ON personal_mision FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "personal_mision_delete" ON personal_mision FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- ATENDIDOS
CREATE POLICY "atendidos_select" ON atendidos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_insert" ON atendidos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_update" ON atendidos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "atendidos_delete" ON atendidos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- NECESIDADES
CREATE POLICY "necesidades_select" ON necesidades FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_insert" ON necesidades FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_update" ON necesidades FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "necesidades_delete" ON necesidades FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- SALIDAS_INSUMOS
CREATE POLICY "salidas_insumos_select" ON salidas_insumos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_insert" ON salidas_insumos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_update" ON salidas_insumos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "salidas_insumos_delete" ON salidas_insumos FOR DELETE USING (get_user_role() IN ('director', 'administrador'));

-- 13. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE POR SUPABASE AUTH
-- El rol se fuerza a 'personal' para evitar escalación desde el cliente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.perfiles (id, cedula, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cedula', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    'personal'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Índice único para email (ignora vacíos para evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_email_unique ON perfiles (email) WHERE email <> '';
