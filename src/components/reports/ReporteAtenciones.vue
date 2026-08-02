<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Atendido } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
}>()

const tipoLabels: Record<string, string> = {
  medica: 'Médica', psicosocial: 'Psicosocial', alimento: 'Alimentación',
  refugio: 'Refugio', higiene: 'Higiene', informacion: 'Orientación',
  traslado: 'Traslado', otro: 'Otro',
}

const sexoLabels: Record<string, string> = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' }

const areaLabels: Record<string, string> = {
  general: 'General', medicina_humana: 'Medicina Humana',
  psicologia: 'Psicología', veterinaria: 'Veterinaria', logistica: 'Logística',
}

const porArea = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    const k = a.area_registro || 'general'
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ area: areaLabels[k] || k, cantidad: v }))
})

const porTipo = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    const k = a.tipo_atencion ?? 'otro'
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ tipo: tipoLabels[k] ?? k, cantidad: v }))
})

const porSexo = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    const k = a.sexo ?? 'otro'
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).map(([k, v]) => ({ sexo: sexoLabels[k] ?? k, cantidad: v }))
})

const gruposEtarios = computed(() => {
  const g: Record<string, number> = { '0-12': 0, '13-17': 0, '18-30': 0, '31-50': 0, '51+': 0 }
  for (const a of props.atendidos) {
    const e = a.edad
    if (e == null) continue
    if (e <= 12) g['0-12']!++
    else if (e <= 17) g['13-17']!++
    else if (e <= 30) g['18-30']!++
    else if (e <= 50) g['31-50']!++
    else g['51+']!++
  }
  return Object.entries(g).map(([k, v]) => ({ grupo: k, cantidad: v }))
})

const vulnerabilidades = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    if (!a.vulnerabilidad) continue
    const arr = Array.isArray(a.vulnerabilidad) ? a.vulnerabilidad : []
    for (const v of arr) c[v] = (c[v] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ vulnerabilidad: k, cantidad: v }))
})

const referidos = computed(() => props.atendidos.filter(a => a.referido).length)
const total = computed(() => props.atendidos.length)
const hasData = computed(() => props.atendidos.length > 0)

function vulnLabel(v: string): string {
  const m: Record<string, string> = {
    embarazada: 'Embarazada', discapacidad: 'Discapacidad', adulto_mayor: 'Adulto Mayor',
    menor_no_acompanado: 'Menor no Acompañado', enfermedad_cronica: 'Enf. Crónica', otro: 'Otro',
  }
  return m[v] ?? v
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Atenciones Consolidado</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen</h2>
<table class="info-table">
<tbody>
<tr><td class="info-label">Total de personas atendidas</td><td class="info-value">{{ total }}</td></tr>
<tr><td class="info-label">Personas referidas</td><td class="info-value">{{ referidos }} ({{ total ? Math.round(referidos / total * 100) : 0 }}%)</td></tr>
<tr><td class="info-label">Misiones con atenciones</td><td class="info-value">{{ new Set(props.atendidos.map(a => a.id_mision)).size }}</td></tr>
</tbody>
</table>
    </div>

    <div v-if="porArea.length > 1" class="report-section">
      <h2 class="section-title">Registros por Área</h2>
      <table class="data-table">
        <thead>
          <tr><th>Área</th><th class="text-center">Cantidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in porArea" :key="item.area">
            <td>{{ item.area }}</td>
            <td class="text-center">{{ item.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Atenciones por Tipo</h2>
      <table class="data-table">
        <thead>
          <tr><th>Tipo de Atención</th><th class="text-center">Cantidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in porTipo" :key="r.tipo">
            <td>{{ r.tipo }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Distribución por Sexo</h2>
      <table class="data-table">
        <thead>
          <tr><th>Sexo</th><th class="text-center">Cantidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in porSexo" :key="r.sexo">
            <td>{{ r.sexo }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Grupos Etarios</h2>
      <table class="data-table">
        <thead>
          <tr><th>Grupo</th><th class="text-center">Cantidad</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in gruposEtarios" :key="r.grupo">
            <td>{{ r.grupo }} años</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="vulnerabilidades.length > 0" class="report-section">
      <h2 class="section-title">Vulnerabilidades Identificadas</h2>
      <table class="data-table">
        <thead>
          <tr><th>Vulnerabilidad</th><th class="text-center">Casos</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in vulnerabilidades" :key="r.vulnerabilidad">
            <td>{{ vulnLabel(r.vulnerabilidad) }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Atenciones Consolidado</h1>
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
