<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Atendido, PersonalMision } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
  personales: PersonalMision[]
}>()

const carga = computed(() => {
  const map: Record<string, { nombre: string; cedula: string; misiones: Set<string>; atenciones: number; ultima: string }> = {}
  for (const a of props.atendidos) {
    if (!map[a.cedula_personal]) {
      const p = props.personales.find(p2 => p2.cedula === a.cedula_personal)
      map[a.cedula_personal] = { nombre: p?.nombre ?? a.cedula_personal, cedula: a.cedula_personal, misiones: new Set(), atenciones: 0, ultima: '' }
    }
    map[a.cedula_personal].atenciones++
    map[a.cedula_personal].misiones.add(a.id_mision)
    if (a.fecha_hora_atencion && a.fecha_hora_atencion > map[a.cedula_personal].ultima) {
      map[a.cedula_personal].ultima = a.fecha_hora_atencion
    }
  }
  return Object.values(map).sort((a, b) => b.atenciones - a.atenciones)
})

const totalVoluntarios = computed(() => carga.value.length)
const totalAtenciones = computed(() => props.atendidos.length)
const hasData = computed(() => props.atendidos.length > 0)

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Actividad del Personal</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen</h2>
      <table class="info-table">
        <tr><td class="info-label">Voluntarios con actividad</td><td class="info-value">{{ totalVoluntarios }}</td></tr>
        <tr><td class="info-label">Total de atenciones registradas</td><td class="info-value">{{ totalAtenciones }}</td></tr>
        <tr><td class="info-label">Promedio por voluntario</td><td class="info-value">{{ totalVoluntarios ? (totalAtenciones / totalVoluntarios).toFixed(1) : 0 }}</td></tr>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Detalle por Voluntario</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th class="text-center">Atenciones</th>
            <th class="text-center">Misiones</th>
            <th>Última actividad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in carga" :key="v.cedula">
            <td>{{ v.nombre }}</td>
            <td>{{ v.cedula }}</td>
            <td class="text-center">{{ v.atenciones }}</td>
            <td class="text-center">{{ v.misiones.size }}</td>
            <td>{{ formatDate(v.ultima) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Actividad del Personal</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) }}</p>
    </div>
    <p class="text-text-secondary text-sm italic text-center py-8">No hay datos disponibles.</p>
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
.info-label { width: 240px; font-weight: 600; color: #666; vertical-align: top; }
.info-value { color: #333; }
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { background-color: #F0F0F0; color: #00244D; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #BEBEBE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid #E3E3E3; vertical-align: top; }
.data-table tbody tr:nth-child(even) { background-color: #FAFAFA; }
.text-center { text-align: center; }
</style>
