export type StatusSync = 'pending' | 'synced'
export type RolUsuario = 'director' | 'administrador' | 'coordinador' | 'personal'
export type EstatusMision = 'activa' | 'completada' | 'cancelada'
export type EstatusCargamento = 'entregado' | 'retorno'
export type CategoriaVoluntariado = 'estudiante' | 'profesional' | 'voluntario'
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'
export type EstatusNecesidad = 'reportado' | 'enproceso' | 'atendido'

export interface Mision {
  id: string
  direccion: string
  municipio: string
  estado: string
  fecha_inicio: string
  estatus_mision: EstatusMision
  status_sync: StatusSync
}

export interface InsumoLlevado {
  id: string
  id_mision: string
  categoria: string
  descripcion: string
  cantidad: number
  unidad: string
  observaciones: string
  estatus_cargamento: EstatusCargamento
  status_sync: StatusSync
}

export interface Transporte {
  id: string
  id_mision: string
  tipo_transporte: string
  numero_placa: string
  nombre_conductor: string
  status_sync: StatusSync
}

export interface PersonalMision {
  id: string
  id_mision: string
  cedula: string
  nombre: string
  categoria_voluntariado: CategoriaVoluntariado
  especialidad: string
  area_voluntariado?: string
  status_sync: StatusSync
}

export interface InsumoEntregado {
  id: string
  descripcion: string
  cantidad: number
}

export interface Atendido {
  id: string
  id_mision: string
  cedula_personal: string
  cedula_atendido: string
  nombre_atendido: string
  telefono_contacto: string
  fecha_hora_atencion: string
  notas: string
  insumos_dados: string
  status_sync: StatusSync
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
