<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Atendido } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
}>()

const porMunicipio = computed(() => {
  const misionMap = new Map(props.misiones.map(m => [m.id, m]))
  const c: Record<string, { atendidos: number; misiones: Set<string> }> = {}
  for (const a of props.atendidos) {
    const m = misionMap.get(a.id_mision)
    const mun = m?.municipio ?? 'Sin municipio'
    if (!c[mun]) c[mun] = { atendidos: 0, misiones: new Set() }
    c[mun].atendidos++
    c[mun].misiones.add(a.id_mision)
  }
  const sorted = Object.entries(c).sort((a, b) => b[1].atendidos - a[1].atendidos)
  const totalAtendidos = props.atendidos.length
  return sorted.map(([municipio, data]) => ({
    municipio,
    misiones: data.misiones.size,
    atendidos: data.atendidos,
    porcentaje: totalAtendidos ? Math.round(data.atendidos / totalAtendidos * 100) : 0,
  }))
})

const totalMunicipios = computed(() => porMunicipio.value.length)
const totalAtendidos = computed(() => props.atendidos.length)

const hasData = computed(() => props.atendidos.length > 0)

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Cobertura Geográfica</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen</h2>
      <table class="info-table">
        <tr><td class="info-label">Municipios alcanzados</td><td class="info-value">{{ totalMunicipios }}</td></tr>
        <tr><td class="info-label">Total de personas atendidas</td><td class="info-value">{{ totalAtendidos }}</td></tr>
        <tr><td class="info-label">Período</td><td class="info-value">{{ props.misiones.length > 0 ? `${formatDate(props.misiones[props.misiones.length - 1].fecha_inicio)} — ${formatDate(props.misiones[0].fecha_inicio)}` : '—' }}</td></tr>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Atendidos por Municipio</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Municipio</th>
            <th class="text-center">Misiones</th>
            <th class="text-center">Atendidos</th>
            <th class="text-center">% del Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in porMunicipio" :key="r.municipio">
            <td>{{ r.municipio }}</td>
            <td class="text-center">{{ r.misiones }}</td>
            <td class="text-center">{{ r.atendidos }}</td>
            <td class="text-center">{{ r.porcentaje }}%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-bold">
            <td>Total</td>
            <td class="text-center">{{ props.misiones.length }}</td>
            <td class="text-center">{{ totalAtendidos }}</td>
            <td class="text-center">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Cobertura Geográfica</h1>
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
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { background-color: #F0F0F0; color: #00244D; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #BEBEBE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid #E3E3E3; vertical-align: top; }
.data-table tbody tr:nth-child(even) { background-color: #FAFAFA; }
.data-table tfoot td { padding: 8px 10px; border-top: 2px solid #BEBEBE; background-color: #F0F0F0; }
.text-center { text-align: center; }
</style>
