-- Migración para Sistema de Reporte FTR
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/nsuskftwonycndueahqd/sql/new)

-- 1. Crear enum types
CREATE TYPE rol_usuario AS ENUM ('director', 'administrador', 'coordinador', 'personal');
CREATE TYPE estatus_mision AS ENUM ('activa', 'completada', 'cancelada');
CREATE TYPE estatus_cargamento AS ENUM ('entregado', 'retorno');
CREATE TYPE categoria_voluntariado AS ENUM ('estudiante', 'profesional', 'voluntario');
CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE estatus_necesidad AS ENUM ('reportado', 'enproceso', 'atendido');
CREATE TYPE status_sync AS ENUM ('pending', 'synced');

-- 2. Tabla de perfiles de usuario (vinculada a auth.users)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'personal',
  categoria_voluntariado categoria_voluntariado DEFAULT NULL,
  especialidad TEXT DEFAULT '',
  area_voluntariado TEXT DEFAULT '',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Misiones
CREATE TABLE misiones (
  id UUID PRIMARY KEY,
  direccion TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  estatus_mision estatus_mision NOT NULL DEFAULT 'activa',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Insumos llevados
CREATE TABLE insumos (
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

-- 5. Transporte
CREATE TABLE transporte (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  tipo_transporte TEXT NOT NULL,
  numero_placa TEXT NOT NULL,
  nombre_conductor TEXT NOT NULL,
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Personal / Voluntarios
CREATE TABLE personal_mision (
  id UUID PRIMARY KEY,
  id_mision UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria_voluntariado categoria_voluntariado NOT NULL DEFAULT 'voluntario',
  especialidad TEXT DEFAULT '',
  status_sync status_sync NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Atendidos
CREATE TABLE atendidos (
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

-- 8. Necesidades
CREATE TABLE necesidades (
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

-- 9. Índices
CREATE INDEX idx_insumos_mision ON insumos(id_mision);
CREATE INDEX idx_transporte_mision ON transporte(id_mision);
CREATE INDEX idx_personal_mision ON personal_mision(id_mision);
CREATE INDEX idx_atendidos_mision ON atendidos(id_mision);
CREATE INDEX idx_necesidades_mision ON necesidades(id_mision);
CREATE INDEX idx_misiones_status ON misiones(status_sync);
CREATE INDEX idx_perfiles_cedula ON perfiles(cedula);

-- 10. Row Level Security (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE misiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_mision ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los usuarios autenticados pueden leer/escribir
CREATE POLICY "Usuarios autenticados pueden leer perfiles" ON perfiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer misiones" ON misiones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar misiones" ON misiones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar misiones" ON misiones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer insumos" ON insumos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar insumos" ON insumos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer transporte" ON transporte FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar transporte" ON transporte FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer personal_mision" ON personal_mision FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar personal_mision" ON personal_mision FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer atendidos" ON atendidos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar atendidos" ON atendidos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden leer necesidades" ON necesidades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar necesidades" ON necesidades FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 11. Trigger para crear perfil automáticamente al registrarse
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Migración para agregar columnas de perfil (ejecutar si la tabla ya existe)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS categoria_voluntariado categoria_voluntariado DEFAULT NULL;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS especialidad TEXT DEFAULT '';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS area_voluntariado TEXT DEFAULT '';
