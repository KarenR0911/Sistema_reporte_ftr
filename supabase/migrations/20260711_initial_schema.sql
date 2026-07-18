-- ============================================================
-- Migración base: esquema completo del sistema de reporte FTR
-- Idempotente: se puede ejecutar en proyecto nuevo o existente
-- ============================================================

-- 1. ENUM TYPES
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

-- 2. TABLAS
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

CREATE TABLE IF NOT EXISTS transporte (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  tipo_transporte TEXT NOT NULL,
  numero_placa TEXT NOT NULL,
  nombre_conductor TEXT NOT NULL,
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_mision (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria_voluntariado categoria_voluntariado NOT NULL DEFAULT 'voluntario',
  especialidad TEXT DEFAULT '',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atendidos (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  cedula_personal TEXT NOT NULL,
  cedula_atendido TEXT NOT NULL,
  nombre_atendido TEXT NOT NULL,
  telefono_contacto TEXT DEFAULT '',
  fecha_hora_atencion TIMESTAMPTZ NOT NULL DEFAULT now(),
  edad INT,
  sexo TEXT,
  tipo_atencion TEXT,
  referido BOOLEAN NOT NULL DEFAULT false,
  vulnerabilidad TEXT NOT NULL DEFAULT '[]',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_insumos_mision ON insumos(id_mision);
CREATE INDEX IF NOT EXISTS idx_transporte_mision ON transporte(id_mision);
CREATE INDEX IF NOT EXISTS idx_personal_mision ON personal_mision(id_mision);
CREATE INDEX IF NOT EXISTS idx_atendidos_mision ON atendidos(id_mision);
CREATE INDEX IF NOT EXISTS idx_necesidades_mision ON necesidades(id_mision);
CREATE INDEX IF NOT EXISTS idx_misiones_status ON misiones(status_sync);
CREATE INDEX IF NOT EXISTS idx_perfiles_cedula ON perfiles(cedula);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_email_unique ON perfiles (email) WHERE email <> '';

-- 4. FUNCIONES HELPER PARA RLS
CREATE OR REPLACE FUNCTION public.is_admin_or_director()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('director', 'administrador')
    AND activo = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_or_above()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol IN ('director', 'administrador', 'coordinador')
    AND activo = true
  );
END;
$$;

-- 5. ROW LEVEL SECURITY
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE misiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_mision ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS (versión final con JWT)

-- PERFILES
DROP POLICY IF EXISTS "Permitir lectura anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir insert anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir update anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "Permitir delete anon perfiles" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_own_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_own_or_admin_or_coordinator" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_trigger_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own_or_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete_admin_only" ON perfiles;

CREATE POLICY "perfiles_select_own_or_admin_or_coordinator" ON perfiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin_or_director() OR
    public.is_coordinator_or_above()
  );

CREATE POLICY "perfiles_insert_trigger_or_admin" ON perfiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin_or_director()
  );

CREATE POLICY "perfiles_update_own_or_admin" ON perfiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin_or_director()
  );

CREATE POLICY "perfiles_delete_admin_only" ON perfiles
  FOR DELETE USING (
    public.is_admin_or_director()
  );

-- MISIONES
DROP POLICY IF EXISTS "Permitir lectura anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir insert anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir update anon misiones" ON misiones;
DROP POLICY IF EXISTS "Permitir delete anon misiones" ON misiones;

CREATE POLICY "misiones_select_auth" ON misiones
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "misiones_insert_auth" ON misiones
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "misiones_update_auth" ON misiones
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "misiones_delete_admin_only" ON misiones
  FOR DELETE USING (public.is_admin_or_director());

-- INSUMOS
DROP POLICY IF EXISTS "Permitir lectura anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir insert anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir update anon insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir delete anon insumos" ON insumos;

CREATE POLICY "insumos_select_auth" ON insumos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "insumos_insert_auth" ON insumos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "insumos_update_auth" ON insumos
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "insumos_delete_admin_only" ON insumos
  FOR DELETE USING (public.is_admin_or_director());

-- TRANSPORTE
DROP POLICY IF EXISTS "Permitir lectura anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir insert anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir update anon transporte" ON transporte;
DROP POLICY IF EXISTS "Permitir delete anon transporte" ON transporte;

CREATE POLICY "transporte_select_auth" ON transporte
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transporte_insert_auth" ON transporte
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "transporte_update_auth" ON transporte
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "transporte_delete_admin_only" ON transporte
  FOR DELETE USING (public.is_admin_or_director());

-- PERSONAL_MISION
DROP POLICY IF EXISTS "Permitir lectura anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir insert anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir update anon personal_mision" ON personal_mision;
DROP POLICY IF EXISTS "Permitir delete anon personal_mision" ON personal_mision;

CREATE POLICY "personal_mision_select_auth" ON personal_mision
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "personal_mision_insert_auth" ON personal_mision
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "personal_mision_update_auth" ON personal_mision
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "personal_mision_delete_admin_only" ON personal_mision
  FOR DELETE USING (public.is_admin_or_director());

-- ATENDIDOS
DROP POLICY IF EXISTS "Permitir lectura anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir insert anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir update anon atendidos" ON atendidos;
DROP POLICY IF EXISTS "Permitir delete anon atendidos" ON atendidos;

CREATE POLICY "atendidos_select_auth" ON atendidos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "atendidos_insert_auth" ON atendidos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "atendidos_update_auth" ON atendidos
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "atendidos_delete_admin_only" ON atendidos
  FOR DELETE USING (public.is_admin_or_director());

-- NECESIDADES
DROP POLICY IF EXISTS "Permitir lectura anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir insert anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir update anon necesidades" ON necesidades;
DROP POLICY IF EXISTS "Permitir delete anon necesidades" ON necesidades;

CREATE POLICY "necesidades_select_auth" ON necesidades
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "necesidades_insert_auth" ON necesidades
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "necesidades_update_auth" ON necesidades
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "necesidades_delete_admin_only" ON necesidades
  FOR DELETE USING (public.is_admin_or_director());

-- 7. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE POR SUPABASE AUTH
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. TRIGGER: AUTO-POBLAR CAMPOS DE auth.users EN INSERTS DIRECTOS
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
