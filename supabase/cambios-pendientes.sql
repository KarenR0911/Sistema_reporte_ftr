-- ============================================================
-- CAMBIOS PENDIENTES PARA SUPABASE
-- Ejecutar en SQL Editor cuando se decida aplicar:
-- https://supabase.com/dashboard/project/nsuskftwonycndueahqd/sql/new
-- ============================================================

-- Pendiente: agregar columnas de perfil si no se ejecutó migration.sql completo
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS categoria_voluntariado categoria_voluntariado DEFAULT NULL;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS especialidad TEXT DEFAULT '';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS area_voluntariado TEXT DEFAULT '';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE DEFAULT '';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- 1. PERFILES
INSERT INTO perfiles (id, cedula, nombre, email, password, rol, categoria_voluntariado, especialidad, area_voluntariado, activo) VALUES
('00000001-0000-0000-0000-000000000001', 'V-12345678', 'Carlos Mendoza', 'V-12345678@ftr.app', '123456', 'director', NULL, '', '', true),
('00000001-0000-0000-0000-000000000002', 'V-23456789', 'María González', 'V-23456789@ftr.app', '123456', 'administrador', NULL, '', '', true),
('00000001-0000-0000-0000-000000000003', 'V-34567890', 'Pedro Ramírez', 'V-34567890@ftr.app', '123456', 'coordinador', NULL, '', '', true),
('00000001-0000-0000-0000-000000000004', 'V-45678901', 'Ana Castillo', 'V-45678901@ftr.app', '123456', 'coordinador', NULL, '', '', true),
('00000001-0000-0000-0000-000000000005', 'V-56789012', 'Dr. Luis Herrera', 'V-56789012@ftr.app', '123456', 'personal', 'profesional', 'Medicina General', 'Medicina', true),
('00000001-0000-0000-0000-000000000006', 'V-67890123', 'Dra. Carmen Rivas', 'V-67890123@ftr.app', '123456', 'personal', 'profesional', 'Pediatría', 'Medicina', true),
('00000001-0000-0000-0000-000000000007', 'V-78901234', 'Enf. José Torres', 'V-78901234@ftr.app', '123456', 'personal', 'profesional', 'Enfermería', 'Medicina', true),
('00000001-0000-0000-0000-000000000008', 'V-89012345', 'Psic. Sofía Medina', 'V-89012345@ftr.app', '123456', 'personal', 'profesional', 'Psicología Clínica', 'Salud Mental', true),
('00000001-0000-0000-0000-000000000009', 'V-90123456', 'Ing. Andrés Blanco', 'V-90123456@ftr.app', '123456', 'personal', 'profesional', 'Ingeniería Civil', 'Infraestructura', true),
('00000001-0000-0000-0000-000000000010', 'V-11223344', 'Lic. Laura Peña', 'V-11223344@ftr.app', '123456', 'personal', 'profesional', 'Trabajo Social', 'Atención Social', true),
('00000001-0000-0000-0000-000000000011', 'V-22334455', 'Jorge Salazar', 'V-22334455@ftr.app', '123456', 'personal', 'voluntario', '', 'Logística', true),
('00000001-0000-0000-0000-000000000012', 'V-33445566', 'Diana Contreras', 'V-33445566@ftr.app', '123456', 'personal', 'voluntario', '', 'Alimentación', true),
('00000001-0000-0000-0000-000000000013', 'V-44556677', 'Ricardo Paredes', 'V-44556677@ftr.app', '123456', 'personal', 'voluntario', '', 'Transporte', true),
('00000001-0000-0000-0000-000000000014', 'V-55667788', 'Martha Rangel', 'V-55667788@ftr.app', '123456', 'personal', 'voluntario', '', 'Alimentación', true),
('00000001-0000-0000-0000-000000000015', 'V-66778899', 'Fernando Rincón', 'V-66778899@ftr.app', '123456', 'personal', 'voluntario', '', 'Comunicaciones', true),
('00000001-0000-0000-0000-000000000016', 'V-77889900', 'Gabriela Rojas', 'V-77889900@ftr.app', '123456', 'personal', 'estudiante', 'Medicina', 'Medicina', true),
('00000001-0000-0000-0000-000000000017', 'V-88990011', 'Samuel Duarte', 'V-88990011@ftr.app', '123456', 'personal', 'estudiante', 'Psicología', 'Salud Mental', true),
('00000001-0000-0000-0000-000000000018', 'V-99001122', 'Valentina Rangel', 'V-99001122@ftr.app', '123456', 'personal', 'estudiante', 'Enfermería', 'Medicina', true),
('00000001-0000-0000-0000-000000000019', 'V-10020033', 'Roberto Jiménez', 'V-10020033@ftr.app', '123456', 'personal', 'voluntario', '', 'Logística', false)
ON CONFLICT (id) DO NOTHING;

-- 2. MISIONES
INSERT INTO misiones (id, direccion, municipio, estado, fecha_inicio, estatus_mision, status_sync) VALUES
('00000002-0000-0000-0000-000000000001', 'Av. Bolívar, Sector La Victoria', 'Barinas', 'Barinas', '2026-05-10 08:00:00-04', 'completada', 'synced'),
('00000002-0000-0000-0000-000000000002', 'Calle Principal, Parroquia Milla', 'Libertador', 'Mérida', '2026-05-15 09:00:00-04', 'completada', 'synced'),
('00000002-0000-0000-0000-000000000003', 'Barrio San José, Vía Panamericana', 'San Cristóbal', 'Táchira', '2026-05-20 07:30:00-04', 'completada', 'synced'),
('00000002-0000-0000-0000-000000000004', 'Sector El Milagro, Carretera Lara-Zulia', 'Maracaibo', 'Zulia', '2026-06-01 08:00:00-04', 'activa', 'synced'),
('00000002-0000-0000-0000-000000000005', 'Urbanización Santa Rosa', 'Barquisimeto', 'Lara', '2026-06-10 08:30:00-04', 'activa', 'pending'),
('00000002-0000-0000-0000-000000000006', 'Av. Las Américas, Centro Comunitario', 'Valencia', 'Carabobo', '2026-06-18 09:00:00-04', 'activa', 'pending'),
('00000002-0000-0000-0000-000000000007', 'Parroquia El Valle, Calle Real', 'Libertador', 'Distrito Capital', '2026-06-22 07:00:00-04', 'activa', 'pending'),
('00000002-0000-0000-0000-000000000008', 'Sector Playa Grande', 'Cumaná', 'Sucre', '2026-04-05 08:00:00-04', 'completada', 'synced')
ON CONFLICT (id) DO NOTHING;

-- 3. INSUMOS
INSERT INTO insumos (id, id_mision, categoria, descripcion, cantidad, unidad, observaciones, estatus_cargamento, status_sync) VALUES
-- Misión 1 - Barinas
('00000003-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Medicinas', 'Analgésicos (Acetaminofén)', 500, 'unidades', 'Lote donado por Farmahorro', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'Medicinas', 'Antibióticos (Amoxicilina)', 200, 'unidades', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000001', 'Alimentos', 'Arroz', 300, 'kg', 'Paquetes de 1kg', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000001', 'Alimentos', 'Harina de maíz', 200, 'kg', '', 'retorno', 'synced'),
('00000003-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000001', 'Higiene', 'Pastillas de jabón', 400, 'unidades', '', 'entregado', 'synced'),
-- Misión 2 - Mérida
('00000003-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000002', 'Medicinas', 'Suero oral', 1000, 'sobres', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000007', '00000002-0000-0000-0000-000000000002', 'Alimentos', 'Leche en polvo', 150, 'kg', 'Para niños y adultos mayores', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000008', '00000002-0000-0000-0000-000000000002', 'Ropa', 'Frazadas', 100, 'unidades', 'Donación textilera', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000009', '00000002-0000-0000-0000-000000000002', 'Herramientas', 'Lámparas solares', 50, 'unidades', '', 'retorno', 'synced'),
-- Misión 3 - Táchira
('00000003-0000-0000-0000-000000000010', '00000002-0000-0000-0000-000000000003', 'Alimentos', 'Pasta', 400, 'kg', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000011', '00000002-0000-0000-0000-000000000003', 'Medicinas', 'Vitaminas pediátricas', 300, 'unidades', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000012', '00000002-0000-0000-0000-000000000003', 'Higiene', 'Pañales desechables', 500, 'unidades', 'Tallas S y M', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000013', '00000002-0000-0000-0000-000000000003', 'Higiene', 'Cepillos de dientes', 200, 'unidades', '', 'entregado', 'synced'),
-- Misión 4 - Zulia
('00000003-0000-0000-0000-000000000014', '00000002-0000-0000-0000-000000000004', 'Medicinas', 'Antiinflamatorios', 350, 'unidades', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000015', '00000002-0000-0000-0000-000000000004', 'Alimentos', 'Agua embotellada', 1000, 'litros', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000016', '00000002-0000-0000-0000-000000000004', 'Alimentos', 'Enlatados (sardina, atún)', 600, 'unidades', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000017', '00000002-0000-0000-0000-000000000004', 'Herramientas', 'Cascos de seguridad', 80, 'unidades', '', 'entregado', 'synced'),
-- Misión 5 - Lara
('00000003-0000-0000-0000-000000000018', '00000002-0000-0000-0000-000000000005', 'Medicinas', 'Antipiréticos infantiles', 250, 'unidades', '', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000019', '00000002-0000-0000-0000-000000000005', 'Alimentos', 'Lentejas', 200, 'kg', '', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000020', '00000002-0000-0000-0000-000000000005', 'Ropa', 'Ropa infantil', 150, 'unidades', '', 'entregado', 'pending'),
-- Misión 6 - Carabobo
('00000003-0000-0000-0000-000000000021', '00000002-0000-0000-0000-000000000006', 'Alimentos', 'Azúcar', 150, 'kg', '', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000022', '00000002-0000-0000-0000-000000000006', 'Higiene', 'Cloro', 100, 'litros', '', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000023', '00000002-0000-0000-0000-000000000006', 'Medicinas', 'Vendas y gasas', 500, 'unidades', '', 'entregado', 'pending'),
-- Misión 7 - Distrito Capital
('00000003-0000-0000-0000-000000000024', '00000002-0000-0000-0000-000000000007', 'Medicinas', 'Insulina', 100, 'unidades', 'Requiere refrigeración', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000025', '00000002-0000-0000-0000-000000000007', 'Alimentos', 'Cereal', 300, 'kg', '', 'entregado', 'pending'),
('00000003-0000-0000-0000-000000000026', '00000002-0000-0000-0000-000000000007', 'Higiene', 'Desinfectante', 80, 'litros', '', 'entregado', 'pending'),
-- Misión 8 - Sucre
('00000003-0000-0000-0000-000000000027', '00000002-0000-0000-0000-000000000008', 'Medicinas', 'Antihistamínicos', 200, 'unidades', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000028', '00000002-0000-0000-0000-000000000008', 'Alimentos', 'Aceite comestible', 100, 'litros', '', 'entregado', 'synced'),
('00000003-0000-0000-0000-000000000029', '00000002-0000-0000-0000-000000000008', 'Herramientas', 'Kit de reparación', 30, 'unidades', '', 'entregado', 'synced')
ON CONFLICT (id) DO NOTHING;

-- 4. TRANSPORTE
INSERT INTO transporte (id, id_mision, tipo_transporte, numero_placa, nombre_conductor, status_sync) VALUES
('00000004-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Camioneta', 'ABC-123', 'Ricardo Paredes', 'synced'),
('00000004-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'Autobús', 'DEF-456', 'Luis Castro', 'synced'),
('00000004-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000002', 'Camioneta', 'GHI-789', 'Ricardo Paredes', 'synced'),
('00000004-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000003', 'Camión', 'JKL-012', 'Fernando Rincón', 'synced'),
('00000004-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000004', 'Camioneta', 'MNO-345', 'Ricardo Paredes', 'synced'),
('00000004-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000004', 'Autobús', 'PQR-678', 'Jorge Salazar', 'synced'),
('00000004-0000-0000-0000-000000000007', '00000002-0000-0000-0000-000000000005', 'Camioneta', 'STU-901', 'Fernando Rincón', 'pending'),
('00000004-0000-0000-0000-000000000008', '00000002-0000-0000-0000-000000000006', 'Camión', 'VWX-234', 'Jorge Salazar', 'pending'),
('00000004-0000-0000-0000-000000000009', '00000002-0000-0000-0000-000000000007', 'Camioneta', 'YZA-567', 'Ricardo Paredes', 'pending'),
('00000004-0000-0000-0000-000000000010', '00000002-0000-0000-0000-000000000008', 'Autobús', 'BCD-890', 'Luis Castro', 'synced')
ON CONFLICT (id) DO NOTHING;

-- 5. PERSONAL POR MISIÓN
INSERT INTO personal_mision (id, id_mision, cedula, nombre, categoria_voluntariado, especialidad, status_sync) VALUES
-- Misión 1 - Barinas
('00000005-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'Dr. Luis Herrera', 'profesional', 'Medicina General', 'synced'),
('00000005-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'V-78901234', 'Enf. José Torres', 'profesional', 'Enfermería', 'synced'),
('00000005-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000001', 'V-22334455', 'Jorge Salazar', 'voluntario', '', 'synced'),
('00000005-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000001', 'V-77889900', 'Gabriela Rojas', 'estudiante', 'Medicina', 'synced'),
-- Misión 2 - Mérida
('00000005-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'Dra. Carmen Rivas', 'profesional', 'Pediatría', 'synced'),
('00000005-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000002', 'V-89012345', 'Psic. Sofía Medina', 'profesional', 'Psicología Clínica', 'synced'),
('00000005-0000-0000-0000-000000000007', '00000002-0000-0000-0000-000000000002', 'V-33445566', 'Diana Contreras', 'voluntario', '', 'synced'),
-- Misión 3 - Táchira
('00000005-0000-0000-0000-000000000008', '00000002-0000-0000-0000-000000000003', 'V-56789012', 'Dr. Luis Herrera', 'profesional', 'Medicina General', 'synced'),
('00000005-0000-0000-0000-000000000009', '00000002-0000-0000-0000-000000000003', 'V-11223344', 'Lic. Laura Peña', 'profesional', 'Trabajo Social', 'synced'),
('00000005-0000-0000-0000-000000000010', '00000002-0000-0000-0000-000000000003', 'V-55667788', 'Martha Rangel', 'voluntario', '', 'synced'),
('00000005-0000-0000-0000-000000000011', '00000002-0000-0000-0000-000000000003', 'V-88990011', 'Samuel Duarte', 'estudiante', 'Psicología', 'synced'),
-- Misión 4 - Zulia
('00000005-0000-0000-0000-000000000012', '00000002-0000-0000-0000-000000000004', 'V-56789012', 'Dr. Luis Herrera', 'profesional', 'Medicina General', 'synced'),
('00000005-0000-0000-0000-000000000013', '00000002-0000-0000-0000-000000000004', 'V-78901234', 'Enf. José Torres', 'profesional', 'Enfermería', 'synced'),
('00000005-0000-0000-0000-000000000014', '00000002-0000-0000-0000-000000000004', 'V-90123456', 'Ing. Andrés Blanco', 'profesional', 'Ingeniería Civil', 'synced'),
('00000005-0000-0000-0000-000000000015', '00000002-0000-0000-0000-000000000004', 'V-44556677', 'Ricardo Paredes', 'voluntario', '', 'synced'),
('00000005-0000-0000-0000-000000000016', '00000002-0000-0000-0000-000000000004', 'V-99001122', 'Valentina Rangel', 'estudiante', 'Enfermería', 'synced'),
-- Misión 5 - Lara
('00000005-0000-0000-0000-000000000017', '00000002-0000-0000-0000-000000000005', 'V-67890123', 'Dra. Carmen Rivas', 'profesional', 'Pediatría', 'pending'),
('00000005-0000-0000-0000-000000000018', '00000002-0000-0000-0000-000000000005', 'V-33445566', 'Diana Contreras', 'voluntario', '', 'pending'),
('00000005-0000-0000-0000-000000000019', '00000002-0000-0000-0000-000000000005', 'V-77889900', 'Gabriela Rojas', 'estudiante', 'Medicina', 'pending'),
-- Misión 6 - Carabobo
('00000005-0000-0000-0000-000000000020', '00000002-0000-0000-0000-000000000006', 'V-89012345', 'Psic. Sofía Medina', 'profesional', 'Psicología Clínica', 'pending'),
('00000005-0000-0000-0000-000000000021', '00000002-0000-0000-0000-000000000006', 'V-11223344', 'Lic. Laura Peña', 'profesional', 'Trabajo Social', 'pending'),
('00000005-0000-0000-0000-000000000022', '00000002-0000-0000-0000-000000000006', 'V-66778899', 'Fernando Rincón', 'voluntario', '', 'pending'),
-- Misión 7 - Distrito Capital
('00000005-0000-0000-0000-000000000023', '00000002-0000-0000-0000-000000000007', 'V-56789012', 'Dr. Luis Herrera', 'profesional', 'Medicina General', 'pending'),
('00000005-0000-0000-0000-000000000024', '00000002-0000-0000-0000-000000000007', 'V-90123456', 'Ing. Andrés Blanco', 'profesional', 'Ingeniería Civil', 'pending'),
('00000005-0000-0000-0000-000000000025', '00000002-0000-0000-0000-000000000007', 'V-55667788', 'Martha Rangel', 'voluntario', '', 'pending'),
-- Misión 8 - Sucre
('00000005-0000-0000-0000-000000000026', '00000002-0000-0000-0000-000000000008', 'V-78901234', 'Enf. José Torres', 'profesional', 'Enfermería', 'synced'),
('00000005-0000-0000-0000-000000000027', '00000002-0000-0000-0000-000000000008', 'V-22334455', 'Jorge Salazar', 'voluntario', '', 'synced'),
('00000005-0000-0000-0000-000000000028', '00000002-0000-0000-0000-000000000008', 'V-88990011', 'Samuel Duarte', 'estudiante', 'Psicología', 'synced')
ON CONFLICT (id) DO NOTHING;

-- 6. ATENDIDOS
INSERT INTO atendidos (id, id_mision, cedula_personal, cedula_atendido, nombre_atendido, telefono_contacto, fecha_hora_atencion, notas, insumos_dados, status_sync) VALUES
-- Misión 1 - Barinas
('00000006-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-10123456', 'María Pérez', '0412-1112233', '2026-05-10 09:15:00-04', 'Paciente hipertensa, control de presión', 'Acetaminofén', 'synced'),
('00000006-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-10234567', 'José Contreras', '0414-2233445', '2026-05-10 09:45:00-04', 'Infección respiratoria', 'Amoxicilina, Acetaminofén', 'synced'),
('00000006-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000001', 'V-78901234', 'V-10345678', 'Ana Torres', '0426-3344556', '2026-05-10 10:00:00-04', 'Curaciones herida leve', 'Vendas, gasas, jabón', 'synced'),
('00000006-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000001', 'V-77889900', 'V-10456789', 'Pedro Rivas', '0412-4455667', '2026-05-10 10:30:00-04', 'Dolor lumbar crónico', 'Analgésicos, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-10567890', 'Rosa Blanco', '0416-5566778', '2026-05-10 11:00:00-04', 'Control prenatal, 6 meses', 'Vitaminas, leche', 'synced'),
('00000006-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000001', 'V-78901234', 'V-10678901', 'Luis Medina', '0424-6677889', '2026-05-10 14:00:00-04', 'Diarrea aguda', 'Suero oral, antibióticos', 'synced'),
('00000006-0000-0000-0000-000000000007', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-10789012', 'Carmen Duarte', '0412-7788990', '2026-05-10 14:30:00-04', 'Alergia estacional', 'Antihistamínicos', 'synced'),
('00000006-0000-0000-0000-000000000008', '00000002-0000-0000-0000-000000000001', 'V-22334455', 'V-10890123', 'Jorge Castillo', '0414-8899001', '2026-05-10 15:00:00-04', 'Entrega alimentos familiar 4 miembros', 'Arroz 10kg, harina 5kg, jabón 10u', 'synced'),
('00000006-0000-0000-0000-000000000009', '00000002-0000-0000-0000-000000000001', 'V-77889900', 'V-10901234', 'Laura Rangel', '0426-9900112', '2026-05-10 15:30:00-04', 'Niño de 4 años, fiebre', 'Antipirético infantil', 'synced'),
('00000006-0000-0000-0000-000000000010', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-11012345', 'Carlos Jiménez', '0412-1011123', '2026-05-10 16:00:00-04', 'Diabetes tipo 2, control', 'Insulina, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000011', '00000002-0000-0000-0000-000000000001', 'V-78901234', 'V-11123456', 'Marta Rojas', '0414-1213145', '2026-05-10 16:30:00-04', 'Infección urinaria', 'Antibióticos, analgésicos', 'synced'),
('00000006-0000-0000-0000-000000000012', '00000002-0000-0000-0000-000000000001', 'V-56789012', 'V-11234567', 'Alberto Rivas', '0426-1314156', '2026-05-10 17:00:00-04', 'Control general, 70 años', 'Vitaminas adulto mayor, leche', 'synced'),
-- Misión 2 - Mérida
('00000006-0000-0000-0000-000000000013', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'V-20123456', 'Sofía Molina', '0412-1516178', '2026-05-15 09:30:00-04', 'Niño 2 años, control pediátrico', 'Vitaminas, leche', 'synced'),
('00000006-0000-0000-0000-000000000014', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'V-20234567', 'Tomás Rincón', '0414-1617189', '2026-05-15 10:00:00-04', 'Vacunación menor', '-', 'synced'),
('00000006-0000-0000-0000-000000000015', '00000002-0000-0000-0000-000000000002', 'V-89012345', 'V-20345678', 'Elena Paredes', '0426-1718190', '2026-05-15 10:30:00-04', 'Ansiedad generalizada, contención emocional', '-', 'synced'),
('00000006-0000-0000-0000-000000000016', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'V-20456789', 'Andrés Medina', '0412-1819201', '2026-05-15 11:00:00-04', 'Infección oído niño 5 años', 'Amoxicilina', 'synced'),
('00000006-0000-0000-0000-000000000017', '00000002-0000-0000-0000-000000000002', 'V-33445566', 'V-20567890', 'Cecilia Rangel', '0414-1920212', '2026-05-15 11:30:00-04', 'Entrega frazadas y alimentos', 'Frazadas 3, leche 5kg, arroz 10kg', 'synced'),
('00000006-0000-0000-0000-000000000018', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'V-20678901', 'Pablo Contreras', '0426-2021223', '2026-05-15 14:00:00-04', 'Bronquitis infantil', 'Antibióticos jarabe', 'synced'),
('00000006-0000-0000-0000-000000000019', '00000002-0000-0000-0000-000000000002', 'V-89012345', 'V-20789012', 'Raquel Duarte', '0412-2122234', '2026-05-15 15:00:00-04', 'Terapia familiar, duelo', '-', 'synced'),
('00000006-0000-0000-0000-000000000020', '00000002-0000-0000-0000-000000000002', 'V-67890123', 'V-20890123', 'David Rojas', '0414-2223245', '2026-05-15 15:30:00-04', 'Niño 8 años, desnutrición leve', 'Leche, vitaminas', 'synced'),
-- Misión 3 - Táchira
('00000006-0000-0000-0000-000000000021', '00000002-0000-0000-0000-000000000003', 'V-56789012', 'V-30123456', 'Lucía Mora', '0412-2324256', '2026-05-20 08:30:00-04', 'Hipertensión severa, derivar', 'Antihipertensivos', 'synced'),
('00000006-0000-0000-0000-000000000022', '00000002-0000-0000-0000-000000000003', 'V-56789012', 'V-30234567', 'Fernando León', '0414-2425267', '2026-05-20 09:00:00-04', 'Conjuntivitis bacteriana', 'Antibióticos gotas', 'synced'),
('00000006-0000-0000-0000-000000000023', '00000002-0000-0000-0000-000000000003', 'V-11223344', 'V-30345678', 'Rosa Cadenas', '0426-2526278', '2026-05-20 09:30:00-04', 'Evaluación de vivienda', 'Pañales, leche, alimentos', 'synced'),
('00000006-0000-0000-0000-000000000024', '00000002-0000-0000-0000-000000000003', 'V-55667788', 'V-30456789', 'Jorge Avendaño', '0412-2627289', '2026-05-20 10:00:00-04', 'Entrega víveres familia numerosa', 'Pasta 15kg, arroz 10kg', 'synced'),
('00000006-0000-0000-0000-000000000025', '00000002-0000-0000-0000-000000000003', 'V-56789012', 'V-30567890', 'Carmen Rangel', '0414-2728290', '2026-05-20 10:30:00-04', 'Dermatitis', 'Antifúngicos, cremas', 'synced'),
('00000006-0000-0000-0000-000000000026', '00000002-0000-0000-0000-000000000003', 'V-88990011', 'V-30678901', 'Samuel Pérez', '0426-2829301', '2026-05-20 11:00:00-04', 'Evaluación psicológica niño con trauma', '-', 'synced'),
('00000006-0000-0000-0000-000000000027', '00000002-0000-0000-0000-000000000003', 'V-56789012', 'V-30789012', 'Mireya Soto', '0412-2930312', '2026-05-20 14:00:00-04', 'Gripe común', 'Antipiréticos, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000028', '00000002-0000-0000-0000-000000000003', 'V-11223344', 'V-30890123', 'Oscar Duque', '0414-3031323', '2026-05-20 14:30:00-04', 'Entrega pañales y alimentos', 'Pañales 40u, arroz 5kg, pasta 5kg', 'synced'),
-- Misión 4 - Zulia
('00000006-0000-0000-0000-000000000029', '00000002-0000-0000-0000-000000000004', 'V-56789012', 'V-40123456', 'Nelly Fernández', '0412-3132334', '2026-06-01 08:00:00-04', 'Corte en pierna', 'Vendas, antibióticos, analgésicos', 'synced'),
('00000006-0000-0000-0000-000000000030', '00000002-0000-0000-0000-000000000004', 'V-56789012', 'V-40234567', 'Ramón Alvarado', '0414-3233345', '2026-06-01 08:30:00-04', 'Deshidratación', 'Suero oral, agua', 'synced'),
('00000006-0000-0000-0000-000000000031', '00000002-0000-0000-0000-000000000004', 'V-78901234', 'V-40345678', 'Inés Córdoba', '0426-3334356', '2026-06-01 09:00:00-04', 'Quemadura leve', 'Vendas, cremas, analgésicos', 'synced'),
('00000006-0000-0000-0000-000000000032', '00000002-0000-0000-0000-000000000004', 'V-90123456', 'V-40456789', 'Alberto Paredes', '0412-3435367', '2026-06-01 09:30:00-04', 'Evaluación daños vivienda', '-', 'synced'),
('00000006-0000-0000-0000-000000000033', '00000002-0000-0000-0000-000000000004', 'V-56789012', 'V-40567890', 'Celia Duarte', '0414-3536378', '2026-06-01 10:00:00-04', 'Control niño desnutrido', 'Suplementos, leche, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000034', '00000002-0000-0000-0000-000000000004', 'V-44556677', 'V-40678901', 'Luisana Rincón', '0426-3637389', '2026-06-01 10:30:00-04', 'Entrega agua y enlatados', 'Agua 20L, enlatados 24u', 'synced'),
('00000006-0000-0000-0000-000000000035', '00000002-0000-0000-0000-000000000004', 'V-99001122', 'V-40789012', 'Eduardo Molina', '0412-3738390', '2026-06-01 11:00:00-04', 'Toma de signos', 'Analgésicos, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000036', '00000002-0000-0000-0000-000000000004', 'V-78901234', 'V-40890123', 'Sara Castillo', '0414-3839401', '2026-06-01 11:30:00-04', 'Infección cutánea', 'Antibióticos, cremas', 'synced'),
('00000006-0000-0000-0000-000000000037', '00000002-0000-0000-0000-000000000004', 'V-56789012', 'V-40901234', 'Wilmer Peña', '0426-3940412', '2026-06-01 14:00:00-04', 'Dolor abdominal', 'Antiinflamatorios', 'synced'),
('00000006-0000-0000-0000-000000000038', '00000002-0000-0000-0000-000000000004', 'V-90123456', 'V-41012345', 'Doris Blanco', '0412-4041423', '2026-06-01 14:30:00-04', 'Vivienda colapsada, reubicación', 'Casco seguridad, frazada', 'synced'),
-- Misión 8 - Sucre
('00000006-0000-0000-0000-000000000039', '00000002-0000-0000-0000-000000000008', 'V-78901234', 'V-80123456', 'Yolanda Marín', '0412-4142434', '2026-04-05 09:00:00-04', 'Esguince tobillo', 'Vendas, antiinflamatorios', 'synced'),
('00000006-0000-0000-0000-000000000040', '00000002-0000-0000-0000-000000000008', 'V-22334455', 'V-80234567', 'Ramón Lira', '0414-4243445', '2026-04-05 10:00:00-04', 'Entrega kit herramientas', 'Kit reparación, cascos', 'synced'),
('00000006-0000-0000-0000-000000000041', '00000002-0000-0000-0000-000000000008', 'V-78901234', 'V-80345678', 'Beatriz Guzmán', '0426-4344456', '2026-04-05 11:00:00-04', 'Control presión arterial', 'Antihipertensivos, vitaminas', 'synced'),
('00000006-0000-0000-0000-000000000042', '00000002-0000-0000-0000-000000000008', 'V-88990011', 'V-80456789', 'Marcos Rivas', '0412-4445467', '2026-04-05 11:30:00-04', 'Apoyo psicológico post-inundación', '-', 'synced'),
('00000006-0000-0000-0000-000000000043', '00000002-0000-0000-0000-000000000008', 'V-78901234', 'V-80567890', 'Alicia Córdoba', '0414-4546478', '2026-04-05 14:00:00-04', 'Alergia cutánea', 'Antihistamínicos, cremas, jabón', 'synced'),
('00000006-0000-0000-0000-000000000044', '00000002-0000-0000-0000-000000000008', 'V-22334455', 'V-80678901', 'Héctor Salazar', '0426-4647489', '2026-04-05 14:30:00-04', 'Entrega de alimentos', 'Aceite 5L, arroz 10kg, pasta 5kg', 'synced')
ON CONFLICT (id) DO NOTHING;

-- 7. NECESIDADES
INSERT INTO necesidades (id, id_mision, categoria, descripcion, cantidad_requerida, unidad, observaciones, prioridad, estatus, status_sync) VALUES
('00000007-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Medicinas', 'Insulina para pacientes diabéticos', 100, 'unidades', 'Se agotó durante la jornada', 'critica', 'atendido', 'synced'),
('00000007-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'Infraestructura', 'Reparación techo centro de salud', 1, 'proyecto', '', 'alta', 'enproceso', 'synced'),
('00000007-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000002', 'Medicinas', 'Medicamentos pediátricos', 200, 'unidades', 'Alta demanda infantil', 'alta', 'atendido', 'synced'),
('00000007-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000002', 'Alimentos', 'Leche en polvo', 100, 'kg', '', 'media', 'reportado', 'synced'),
('00000007-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000002', 'Salud Mental', 'Taller de contención emocional', 3, 'sesiones', 'Personas con duelo activo', 'alta', 'reportado', 'synced'),
('00000007-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000003', 'Medicinas', 'Antibióticos amplio espectro', 300, 'unidades', 'Infecciones respiratorias', 'critica', 'enproceso', 'synced'),
('00000007-0000-0000-0000-000000000007', '00000002-0000-0000-0000-000000000003', 'Vivienda', 'Láminas de zinc para techos', 50, 'unidades', 'Temporal de lluvias', 'alta', 'reportado', 'synced'),
('00000007-0000-0000-0000-000000000008', '00000002-0000-0000-0000-000000000004', 'Agua', 'Pastillas potabilizadoras de agua', 1000, 'unidades', 'Agua contaminada', 'critica', 'reportado', 'synced'),
('00000007-0000-0000-0000-000000000009', '00000002-0000-0000-0000-000000000004', 'Medicinas', 'Suero oral', 2000, 'sobres', '', 'critica', 'reportado', 'synced'),
('00000007-0000-0000-0000-000000000010', '00000002-0000-0000-0000-000000000004', 'Alimentos', 'Agua embotellada', 5000, 'litros', '', 'critica', 'enproceso', 'synced'),
('00000007-0000-0000-0000-000000000011', '00000002-0000-0000-0000-000000000005', 'Medicinas', 'Analgésicos', 200, 'unidades', '', 'media', 'reportado', 'pending'),
('00000007-0000-0000-0000-000000000012', '00000002-0000-0000-0000-000000000006', 'Higiene', 'Cloro y desinfectantes', 150, 'litros', 'Prevención enfermedades', 'alta', 'reportado', 'pending'),
('00000007-0000-0000-0000-000000000013', '00000002-0000-0000-0000-000000000007', 'Medicinas', 'Insulina', 200, 'unidades', 'Pacientes insulinodependientes', 'critica', 'reportado', 'pending'),
('00000007-0000-0000-0000-000000000014', '00000002-0000-0000-0000-000000000007', 'Alimentos', 'Cereal y pasta', 500, 'kg', '', 'alta', 'reportado', 'pending'),
('00000007-0000-0000-0000-000000000015', '00000002-0000-0000-0000-000000000008', 'Infraestructura', 'Reparación de vías principales', 1, 'proyecto', 'Dañadas por lluvias', 'alta', 'atendido', 'synced'),
('00000007-0000-0000-0000-000000000016', '00000002-0000-0000-0000-000000000008', 'Vivienda', 'Reubicación temporal de familias', 5, 'familias', '', 'critica', 'enproceso', 'synced')
ON CONFLICT (id) DO NOTHING;
