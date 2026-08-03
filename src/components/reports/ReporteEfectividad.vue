<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Necesidad } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  necesidades: Necesidad[]
}>()

const total = computed(() => props.necesidades.length)
const reportadas = computed(() => props.necesidades.filter(n => n.estatus === 'reportado').length)
const enProceso = computed(() => props.necesidades.filter(n => n.estatus === 'enproceso').length)
const atendidas = computed(() => props.necesidades.filter(n => n.estatus === 'atendido').length)
const tasa = computed(() => total.value ? Math.round(atendidas.value / total.value * 100) : 0)

const criticasPendientes = computed(() =>
  props.necesidades.filter(n => (n.prioridad === 'critica' || n.prioridad === 'alta') && n.estatus !== 'atendido'),
)

const porMision = computed(() => {
  const misionMap = new Map(props.misiones.map(m => [m.id, m]))
  const c: Record<string, { id: string; nombre: string; nec: number; aten: number; prioritarias: number }> = {}
  for (const n of props.necesidades) {
    const m = misionMap.get(n.id_mision)
    const key = n.id_mision
    if (!c[key]) c[key] = { id: key, nombre: m ? `${m.municipio} — ${m.direccion}` : key.slice(0, 8), nec: 0, aten: 0, prioritarias: 0 }
    c[key].nec++
    if (n.estatus === 'atendido') c[key].aten++
    if (n.prioridad === 'critica' || n.prioridad === 'alta') c[key].prioritarias++
  }
  return Object.values(c)
})

const hasData = computed(() => props.necesidades.length > 0)

function labelPrioridad(val: string): string {
  return val === 'critica' ? 'Crítica' : val === 'alta' ? 'Alta' : val === 'media' ? 'Media' : val === 'baja' ? 'Baja' : '—'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Efectividad — Necesidades</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen Global</h2>
<table class="info-table">
<tbody>
<tr><td class="info-label">Total de necesidades reportadas</td><td class="info-value">{{ total }}</td></tr>
<tr><td class="info-label">Atendidas</td><td class="info-value">{{ atendidas }} ({{ tasa }}%)</td></tr>
<tr><td class="info-label">En proceso</td><td class="info-value">{{ enProceso }}</td></tr>
<tr><td class="info-label">Pendientes (reportadas)</td><td class="info-value">{{ reportadas }}</td></tr>
<tr><td class="info-label">Críticas / Altas sin atender</td><td class="info-value font-bold" :style="{ color: criticasPendientes.length > 0 ? '#E53935' : '#4CAF50' }">{{ criticasPendientes.length }}</td></tr>
</tbody>
</table>
    </div>

    <div v-if="criticasPendientes.length > 0" class="report-section">
      <h2 class="section-title">Necesidades Críticas Pendientes</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Descripción</th>
            <th class="text-center">Cant. Requerida</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in criticasPendientes" :key="n.id">
            <td>{{ n.categoria }}</td>
            <td>{{ n.descripcion }}</td>
            <td class="text-center">{{ n.cantidad_requerida }} {{ n.unidad }}</td>
            <td>{{ labelPrioridad(n.prioridad) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Necesidades por Misión</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Misión</th>
            <th class="text-center">Reportadas</th>
            <th class="text-center">Atendidas</th>
            <th class="text-center">Priori. Altas/Crít.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in porMision" :key="r.id">
            <td>{{ r.nombre }}</td>
            <td class="text-center">{{ r.nec }}</td>
            <td class="text-center">{{ r.aten }}</td>
            <td class="text-center">{{ r.prioritarias }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Efectividad — Necesidades</h1>
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
.info-label { width: 260px; font-weight: 600; color: #666; vertical-align: top; }
.info-value { color: #333; }
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { background-color: #F0F0F0; color: #00244D; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #BEBEBE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid #E3E3E3; vertical-align: top; }
.data-table tbody tr:nth-child(even) { background-color: #FAFAFA; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
</style>
