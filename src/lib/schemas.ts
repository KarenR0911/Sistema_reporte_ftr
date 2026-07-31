import { z } from 'zod'
import { INSUMO_CATEGORIAS } from '@/types'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email es requerido').email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

export const usuarioSchema = z.object({
  cedula: z
    .string()
    .min(1, 'Cédula es requerida')
    .regex(/^V-\d+$/, 'Cédula debe tener formato V-12345678'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  rol: z.enum(['director', 'administrador', 'coordinador', 'personal'], {
    message: 'Selecciona un rol válido',
  }),
  categoria_voluntariado: z.enum(['estudiante', 'profesional', 'voluntario']).optional(),
  especialidad: z.string().optional(),
  area_voluntariado: z.string().optional(),
})

export const misionSchema = z.object({
  direccion: z.string().min(1, 'Dirección es requerida'),
  municipio: z.string().min(1, 'Municipio es requerido'),
  estado: z.string().min(1, 'Estado es requerido'),
})

export const transporteSchema = z.object({
  tipo_transporte: z.string().min(1, 'Tipo de transporte es requerido'),
  numero_placa: z.string().min(1, 'Número de placa es requerido'),
  nombre_conductor: z.string().min(1, 'Nombre del conductor es requerido'),
})

export const personalSchema = z.object({
  cedula: z.string().min(1, 'Cédula es requerida'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  categoria_voluntariado: z.enum(['estudiante', 'profesional', 'voluntario']),
  especialidad: z.string().optional(),
  area_voluntariado: z.string().optional(),
})

export const insumoSchema = z.object({
  categoria: z.enum(INSUMO_CATEGORIAS, { message: 'Selecciona una categoría' }),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  cantidad: z.number().positive('Cantidad debe ser mayor a 0'),
  unidad: z.string().min(1, 'Unidad es requerida'),
  observaciones: z.string().optional(),
})

export const atencionSchema = z.object({
  cedula_atendido: z.string().min(1, 'Cédula del atendido es requerida'),
  nombre_atendido: z.string().min(1, 'Nombre del atendido es requerido'),
  edad: z.number().int().positive('Edad debe ser un número positivo').nullable().optional(),
  sexo: z.enum(['masculino', 'femenino', 'otro']).nullable().optional(),
  tipo_atencion: z.enum(['medica', 'psicosocial', 'alimento', 'refugio', 'higiene', 'informacion', 'traslado', 'otro'], {
    message: 'Selecciona un tipo de atención válido',
  }).nullable().optional(),
  referido: z.boolean().optional(),
  vulnerabilidad: z.array(z.enum(['embarazada', 'discapacidad', 'adulto_mayor', 'menor_no_acompanado', 'enfermedad_cronica', 'otro'])).optional(),
  telefono_contacto: z.string().optional(),
  notas: z.string().optional(),
})

export const atencionMedicinaSchema = z.object({
  cedula_atendido: z.string().min(1, 'Cédula del atendido es requerida'),
  nombre_atendido: z.string().min(1, 'Nombre del atendido es requerido'),
  edad: z.number().int().positive('Edad debe ser un número positivo').nullable().optional(),
  sexo: z.enum(['masculino', 'femenino', 'otro']).nullable().optional(),
  motivo_atencion: z.string().min(1, 'Motivo de atención es requerido'),
  lugar_vivia: z.string().min(1, 'Lugar donde vivía es requerido'),
  lugar_actual: z.string().min(1, 'Lugar actual es requerido'),
  tipo_atencion: z.enum(['medica', 'psicosocial', 'alimento', 'refugio', 'higiene', 'informacion', 'traslado', 'otro']).nullable().optional(),
  referido: z.boolean().optional(),
  vulnerabilidad: z.array(z.enum(['embarazada', 'discapacidad', 'adulto_mayor', 'menor_no_acompanado', 'enfermedad_cronica', 'otro'])).optional(),
  telefono_contacto: z.string().optional(),
  notas: z.string().optional(),
})

export const atencionPsicologiaSchema = z.object({
  cedula_atendido: z.string().min(1, 'Cédula del atendido es requerida'),
  nombre_atendido: z.string().min(1, 'Nombre del atendido es requerido'),
  edad: z.number().int().positive('Edad debe ser un número positivo').nullable().optional(),
  sexo: z.enum(['masculino', 'femenino', 'otro']).nullable().optional(),
  motivo_atencion: z.string().min(1, 'Motivo de atención es requerido'),
  lugar_vivia: z.string().min(1, 'Lugar donde vivía es requerido'),
  lugar_actual: z.string().min(1, 'Lugar actual es requerido'),
  telefono_contacto: z.string().optional(),
  notas: z.string().optional(),
})

export const atencionVeterinariaSchema = z.object({
  nombre_atendido: z.string().min(1, 'Nombre del animal es requerido'),
  especie: z.string().min(1, 'Especie es requerida'),
  sexo: z.enum(['masculino', 'femenino']).nullable().optional(),
  edad: z.number().int().positive('Edad debe ser un número positivo').nullable().optional(),
  posee_tutor: z.boolean().optional(),
  rescatado: z.boolean().optional(),
  en_adopcion: z.boolean().optional(),
  diagnostico_tentativo: z.string().min(1, 'Diagnóstico tentativo es requerido'),
  notas: z.string().optional(),
})

export const atencionLogisticaSchema = z.object({
  cedula_atendido: z.string().min(1, 'Cédula es requerida'),
  nombre_atendido: z.string().min(1, 'Nombre completo es requerido'),
  edad: z.number().int().positive('Edad debe ser un número positivo').nullable().optional(),
  sexo: z.enum(['masculino', 'femenino', 'otro']).nullable().optional(),
  lugar_vivia: z.string().min(1, 'Lugar donde vivía es requerido'),
  lugar_actual: z.string().min(1, 'Lugar actual es requerido'),
  insumo_entregado: z.string().min(1, 'Insumo entregado es requerido'),
  notas: z.string().optional(),
})

export const salidaInsumoSchema = z.object({
  id_insumo: z.string().min(1, 'Selecciona un insumo'),
  cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
  motivo: z.string().optional(),
})

export const necesidadSchema = z.object({
  categoria: z.string().min(1, 'Categoría es requerida'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  cantidad_requerida: z.number().positive('Cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  observaciones: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    message: 'Selecciona una prioridad válida',
  }),
})
