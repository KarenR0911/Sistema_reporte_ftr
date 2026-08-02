<script setup lang="ts">
import { computed } from 'vue'
import type { InsumoLlevado, SalidaInsumo } from '@/types'

const props = defineProps<{
  insumos: InsumoLlevado[]
  salidas: SalidaInsumo[]
}>()

const insumoIds = computed(() => new Set(props.insumos.map(i => i.id)))
const salidasValidas = computed(() => props.salidas.filter(s => insumoIds.value.has(s.id_insumo)))

const porCategoria = computed(() => {
  const c: Record<string, { items: number; misiones: Set<string>; unidades: Set<string> }> = {}
  for (const i of props.insumos) {
    if (!c[i.categoria]) c[i.categoria] = { items: 0, misiones: new Set(), unidades: new Set() }
    c[i.categoria]!.items++
    c[i.categoria]!.misiones.add(i.id_mision)
    if (i.unidad) c[i.categoria]!.unidades.add(i.unidad)
  }
  return Object.entries(c).map(([categoria, data]) => ({
    categoria,
    items: data.items,
    unidades: Array.from(data.unidades).join(', ') || '—',
    misiones: data.misiones.size,
  }))
})

const porMotivo = computed(() => {
  const c: Record<string, number> = {}
  for (const s of salidasValidas.value) {
    const mot = s.motivo || 'Sin especificar'
    c[mot] = (c[mot] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
})

const hasData = computed(() => props.insumos.length > 0)

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Insumos — Inventario Global</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen de Inventario</h2>
<table class="info-table">
<tbody>
<tr><td class="info-label">Total de insumos registrados</td><td class="info-value">{{ props.insumos.length }} ítems</td></tr>
<tr><td class="info-label">Salidas registradas</td><td class="info-value">{{ salidasValidas.length }} movimientos</td></tr>
</tbody>
</table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Insumos por Categoría</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th class="text-center">Ítems</th>
            <th>Unidad(es)</th>
            <th class="text-center">Misiones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in porCategoria" :key="r.categoria">
            <td>{{ r.categoria }}</td>
            <td class="text-center">{{ r.items }}</td>
            <td>{{ r.unidades }}</td>
            <td class="text-center">{{ r.misiones }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="porMotivo.length > 0" class="report-section">
      <h2 class="section-title">Salidas por Motivo</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Motivo</th>
            <th class="text-center">Movimientos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[motivo, cant] in porMotivo" :key="motivo">
            <td>{{ motivo }}</td>
            <td class="text-center">{{ cant }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Insumos — Inventario Global</h1>
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
