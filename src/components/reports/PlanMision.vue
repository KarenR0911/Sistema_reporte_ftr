<script setup lang="ts">
import type { Mision, PersonalMision, InsumoLlevado } from '@/types'

defineProps<{
  mission: Mision
  personales: PersonalMision[]
  insumos: InsumoLlevado[]
}>()

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function labelCategoria(val: string): string {
  return val === 'estudiante' ? 'Estudiante' : val === 'profesional' ? 'Profesional' : 'Voluntario'
}
</script>

<template>
  <div class="report">
    <div class="report-header">
      <h1 class="report-title">Plan de Misión / Hoja de Ruta</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Datos de la Misión</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Municipio / Estado</td><td class="info-value">{{ mission.municipio }}, {{ mission.estado }}</td></tr>
          <tr><td class="info-label">Dirección</td><td class="info-value">{{ mission.direccion }}</td></tr>
          <tr><td class="info-label">Fecha de inicio</td><td class="info-value">{{ formatDate(mission.fecha_inicio) }}</td></tr>
          <tr><td class="info-label">Estatus</td><td class="info-value">{{ mission.estatus_mision === 'activa' ? 'Activa' : mission.estatus_mision === 'completada' ? 'Completada' : 'Cancelada' }}</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="personales.length > 0" class="report-section">
      <h2 class="section-title">Personal Asignado</h2>
      <table class="data-table">
        <thead>
          <tr><th>Nombre</th><th>Cédula</th><th>Categoría</th><th>Especialidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in personales" :key="p.id">
            <td>{{ p.nombre }}</td>
            <td>{{ p.cedula }}</td>
            <td>{{ labelCategoria(p.categoria_voluntariado) }}</td>
            <td>{{ p.especialidad || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="insumos.length > 0" class="report-section">
      <h2 class="section-title">Insumos Cargados</h2>
      <table class="data-table">
        <thead>
          <tr><th>Categoría</th><th>Descripción</th><th class="text-center">Cantidad</th><th class="text-center">Unidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="i in insumos" :key="i.id">
            <td>{{ i.categoria }}</td>
            <td>{{ i.descripcion }}</td>
            <td class="text-center">{{ i.cantidad }}</td>
            <td class="text-center">{{ i.unidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section checklist">
      <h2 class="section-title">Lista de Verificación</h2>
      <div class="check-item"> Personal completo ______________________________________</div>
      <div class="check-item"> Insumos cargados _______________________________________</div>
      <div class="check-item"> Equipos de comunicación ________________________________</div>
      <div class="check-item"> Botiquín de primeros auxilios _____________________________</div>
      <div class="check-item"> Agua y alimentos para el equipo __________________________</div>
      <div class="check-item"> Formatos / fichas de atención ____________________________</div>
    </div>

    <div class="footer-signature">
      <p>Coordinador: _______________________________ Firma: _________________</p>
      <p>Fecha de salida: _________________ Hora estimada de retorno: ______________</p>
      <p>Observaciones: ___________________________________________________________</p>
      <p>_________________________________________________________________________</p>
    </div>
  </div>
</template>

<style scoped>
.report { font-family: 'Inria Sans', Arial, sans-serif; color: #333; max-width: 210mm; margin: 0 auto; padding: 40px 32px; }
.report-header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #00244D; }
.report-title { margin: 0; font-size: 24px; font-weight: 700; color: #00244D; text-transform: uppercase; letter-spacing: 1px; }
.report-date { margin: 8px 0 0; font-size: 12px; color: #666; }
.report-section { margin-bottom: 28px; page-break-inside: avoid; }
.section-title { margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #00244D; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px; border-bottom: 2px solid #145CAD; }
.info-table { width: 100%; border-collapse: collapse; }
.info-table td { padding: 6px 12px; font-size: 13px; }
.info-label { width: 180px; font-weight: 600; color: #666; vertical-align: top; }
.info-value { color: #333; }
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { background-color: #F0F0F0; color: #00244D; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #BEBEBE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid #E3E3E3; vertical-align: top; }
.data-table tbody tr:nth-child(even) { background-color: #FAFAFA; }
.text-center { text-align: center; }
.checklist { margin-top: 32px; }
.check-item { padding: 8px 12px; font-size: 13px; border-bottom: 1px dashed #BEBEBE; margin-bottom: 4px; }
.footer-signature { margin-top: 40px; padding-top: 16px; border-top: 1px solid #BEBEBE; }
.footer-signature p { margin: 10px 0; font-size: 13px; color: #333; }
</style>
