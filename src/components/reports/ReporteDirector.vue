<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Atendido, Necesidad, PersonalMision } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
  necesidades: Necesidad[]
  personales: PersonalMision[]
}>()

const totalMisiones = computed(() => props.misiones.length)
const misionesActivas = computed(() => props.misiones.filter(m => m.estatus_mision === 'activa').length)
const totalAtendidos = computed(() => props.atendidos.length)
const totalNecesidades = computed(() => props.necesidades.length)
const necesidadesAtendidas = computed(() => props.necesidades.filter(n => n.estatus === 'atendido').length)

const rendimiento = computed(() => {
  const atendidosMap = new Map<string, number>()
  for (const a of props.atendidos) {
    atendidosMap.set(a.id_mision, (atendidosMap.get(a.id_mision) ?? 0) + 1)
  }
  const necMap = new Map<string, number>()
  const necAtenMap = new Map<string, number>()
  for (const n of props.necesidades) {
    necMap.set(n.id_mision, (necMap.get(n.id_mision) ?? 0) + 1)
    if (n.estatus === 'atendido') necAtenMap.set(n.id_mision, (necAtenMap.get(n.id_mision) ?? 0) + 1)
  }
  const personalMap = new Map<string, number>()
  for (const p of props.personales) {
    personalMap.set(p.id_mision, (personalMap.get(p.id_mision) ?? 0) + 1)
  }
  return props.misiones.map(m => ({
    direccion: m.direccion,
    municipio: m.municipio,
    personal: personalMap.get(m.id) ?? 0,
    atendidos: atendidosMap.get(m.id) ?? 0,
    necesidades: necMap.get(m.id) ?? 0,
    atendidas: necAtenMap.get(m.id) ?? 0,
    estatus: m.estatus_mision,
  }))
})

const hasData = computed(() => props.misiones.length > 0)

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function labelEstatus(val: string): string {
  return val === 'activa' ? 'Activa' : val === 'completada' ? 'Completada' : 'Cancelada'
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte General del Director</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen General</h2>
      <table class="info-table">
        <tr><td class="info-label">Total Misiones</td><td class="info-value">{{ totalMisiones }}</td></tr>
        <tr><td class="info-label">Misiones Activas</td><td class="info-value">{{ misionesActivas }}</td></tr>
        <tr><td class="info-label">Personas Atendidas</td><td class="info-value">{{ totalAtendidos }}</td></tr>
        <tr><td class="info-label">Necesidades Reportadas</td><td class="info-value">{{ totalNecesidades }}</td></tr>
        <tr><td class="info-label">Necesidades Atendidas</td><td class="info-value">{{ necesidadesAtendidas }} ({{ totalNecesidades ? Math.round(necesidadesAtendidas / totalNecesidades * 100) : 0 }}%)</td></tr>
        <tr><td class="info-label">Período</td><td class="info-value">{{ misiones.length > 0 ? `${formatDate(misiones[misiones.length - 1]!.fecha_inicio)} — ${formatDate(misiones[0]!.fecha_inicio)}` : '—' }}</td></tr>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Rendimiento por Misión</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Dirección</th>
            <th>Municipio</th>
            <th class="text-center">Personal</th>
            <th class="text-center">Atendidos</th>
            <th class="text-center">Nec. Reportadas</th>
            <th class="text-center">Nec. Atendidas</th>
            <th class="text-center">Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rendimiento" :key="r.direccion">
            <td>{{ r.direccion }}</td>
            <td>{{ r.municipio }}</td>
            <td class="text-center">{{ r.personal }}</td>
            <td class="text-center">{{ r.atendidos }}</td>
            <td class="text-center">{{ r.necesidades }}</td>
            <td class="text-center">{{ r.atendidas }}</td>
            <td class="text-center">{{ labelEstatus(r.estatus) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte General del Director</h1>
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
.info-label { width: 220px; font-weight: 600; color: #666; vertical-align: top; }
.info-value { color: #333; }
.data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.data-table th { background-color: #F0F0F0; color: #00244D; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #BEBEBE; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid #E3E3E3; vertical-align: top; }
.data-table tbody tr:nth-child(even) { background-color: #FAFAFA; }
.text-center { text-align: center; }
</style>
