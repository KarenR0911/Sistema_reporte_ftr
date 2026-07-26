export type StatusSync = 'pending' | 'synced'
export type RolUsuario = 'director' | 'administrador' | 'coordinador' | 'personal'
export type EstatusMision = 'activa' | 'completada' | 'cancelada'
export type CategoriaVoluntariado = 'estudiante' | 'profesional' | 'voluntario'
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'
export type EstatusNecesidad = 'reportado' | 'enproceso' | 'atendido'
export type TipoAtencion = 'medica' | 'psicosocial' | 'alimento' | 'refugio' | 'higiene' | 'informacion' | 'traslado' | 'otro'
export type Vulnerabilidad = 'embarazada' | 'discapacidad' | 'adulto_mayor' | 'menor_no_acompanado' | 'enfermedad_cronica' | 'otro'

export const INSUMO_CATEGORIAS = [
  'Alimentos / Hidratación',
  'Higiene / Aseo Personal',
  'Limpieza / Desinfección',
  'Ropa / Abrigo / Mantas',
  'Medicamentos',
  'Equipo Médico / Primeros Auxilios',
  'Herramientas / Logística',
  'Pañales / Cuidado Infantil',
  'Otros',
] as const

export type InsumoCategoria = typeof INSUMO_CATEGORIAS[number]

export interface Mision {
  id: string
  direccion: string
  municipio: string
  estado: string
  fecha_inicio: string
  estatus_mision: EstatusMision
  status_sync?: StatusSync
}

export interface InsumoLlevado {
  id: string
  id_mision: string
  categoria: string
  descripcion: string
  cantidad: number
  unidad: string
  observaciones: string
  status_sync?: StatusSync
}

export interface Transporte {
  id: string
  id_mision: string
  tipo_transporte: string
  numero_placa: string
  nombre_conductor: string
  status_sync?: StatusSync
}

export interface PersonalMision {
  id: string
  id_mision: string
  cedula: string
  nombre: string
  categoria_voluntariado: CategoriaVoluntariado
  especialidad: string
  area_voluntariado?: string
  status_sync?: StatusSync
}

export interface Atendido {
  id: string
  id_mision: string
  cedula_personal: string
  cedula_atendido: string
  nombre_atendido: string
  telefono_contacto: string
  fecha_hora_atencion: string
  edad: number | null
  sexo: string | null
  tipo_atencion: TipoAtencion | null
  referido: boolean
  vulnerabilidad: string
  notas: string
  status_sync: StatusSync
}

export interface SalidaInsumo {
  id: string
  id_mision: string
  id_insumo: string
  cantidad: number
  motivo: string
  registrado_por: string
  created_at: string
  status_sync?: StatusSync
}

export interface Necesidad {
  id: string
  id_mision: string
  categoria: string
  descripcion: string
  cantidad_requerida: number
  unidad: string
  observaciones: string
  prioridad: Prioridad
  estatus: EstatusNecesidad
  status_sync: StatusSync
}

export interface Usuario {
  id: string
  cedula: string
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  categoria_voluntariado?: CategoriaVoluntariado
  especialidad?: string
  area_voluntariado?: string
}
