import { z } from 'zod'

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
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  rol: z.enum(['director', 'administrador', 'coordinador', 'personal'], {
    errorMap: () => ({ message: 'Selecciona un rol válido' }),
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
  categoria: z.string().min(1, 'Categoría es requerida'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  cantidad: z.number().positive('Cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  observaciones: z.string().optional(),
})

export const atencionSchema = z.object({
  cedula_atendido: z.string().min(1, 'Cédula del atendido es requerida'),
  nombre_atendido: z.string().min(1, 'Nombre del atendido es requerido'),
  telefono_contacto: z.string().optional(),
  notas: z.string().optional(),
})

export const necesidadSchema = z.object({
  categoria: z.string().min(1, 'Categoría es requerida'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  cantidad_requerida: z.number().positive('Cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  observaciones: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    errorMap: () => ({ message: 'Selecciona una prioridad válida' }),
  }),
})
