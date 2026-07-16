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

-- 9. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_insumos_mision ON insumos(id_mision);
CREATE INDEX IF NOT EXISTS idx_transporte_mision ON transporte(id_mision);
CREATE INDEX IF NOT EXISTS idx_personal_mision ON personal_mision(id_mision);
CREATE INDEX IF NOT EXISTS idx_atendidos_mision ON atendidos(id_mision);
CREATE INDEX IF NOT EXISTS idx_necesidades_mision ON necesidades(id_mision);
CREATE INDEX IF NOT EXISTS idx_misiones_status ON misiones(status_sync);
CREATE INDEX IF NOT EXISTS idx_perfiles_cedula ON perfiles(cedula);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);

-- 10. ROW LEVEL SECURITY (RLS)
-- Se habilita RLS en todas las tablas y se dan permisos amplios a anon
-- para que la PWA funcione offline-first con el anon key de Supabase.
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE misiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_mision ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;

-- Políticas: cualquier solicitud (anon) puede leer todo
CREATE POLICY "Permitir lectura anon perfiles" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon misiones" ON misiones FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon insumos" ON insumos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon transporte" ON transporte FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon personal_mision" ON personal_mision FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon atendidos" ON atendidos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anon necesidades" ON necesidades FOR SELECT USING (true);

-- Políticas: cualquier solicitud (anon) puede insertar
CREATE POLICY "Permitir insert anon perfiles" ON perfiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon misiones" ON misiones FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon insumos" ON insumos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon transporte" ON transporte FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon personal_mision" ON personal_mision FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon atendidos" ON atendidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert anon necesidades" ON necesidades FOR INSERT WITH CHECK (true);

-- Políticas: cualquier solicitud (anon) puede actualizar
CREATE POLICY "Permitir update anon misiones" ON misiones FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon insumos" ON insumos FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon transporte" ON transporte FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon personal_mision" ON personal_mision FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon atendidos" ON atendidos FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon necesidades" ON necesidades FOR UPDATE USING (true);
CREATE POLICY "Permitir update anon perfiles" ON perfiles FOR UPDATE USING (true);

-- Políticas: cualquier solicitud (anon) puede eliminar
CREATE POLICY "Permitir delete anon misiones" ON misiones FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon insumos" ON insumos FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon transporte" ON transporte FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon personal_mision" ON personal_mision FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon atendidos" ON atendidos FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon necesidades" ON necesidades FOR DELETE USING (true);
CREATE POLICY "Permitir delete anon perfiles" ON perfiles FOR DELETE USING (true);

-- 11. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE POR SUPABASE AUTH
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
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'personal')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Índice único para email (ignora vacíos para evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_email_unique ON perfiles (email) WHERE email <> '';
