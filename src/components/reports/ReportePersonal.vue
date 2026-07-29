<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, PersonalMision, Atendido } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  personales: PersonalMision[]
  atendidos: Atendido[]
}>()

const totalPersonas = computed(() => {
  const cedulas = new Set(props.personales.map(p => p.cedula))
  return cedulas.size
})

const porCategoria = computed(() => {
  const c: Record<string, number> = {}
  for (const p of props.personales) {
    const k = p.categoria_voluntariado ?? 'voluntario'
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c)
})

const porMision = computed(() => {
  const misionMap = new Map(props.misiones.map(m => [m.id, m]))
  const c: Record<string, { personal: number; atendidos: number; lista: PersonalMision[] }> = {}
  for (const p of props.personales) {
    const m = misionMap.get(p.id_mision)
    const key = m ? `${m.municipio} — ${m.direccion}` : p.id_mision
    if (!c[key]) c[key] = { personal: 0, atendidos: 0, lista: [] }
    c[key].personal++
    c[key].lista.push(p)
  }
  for (const a of props.atendidos) {
    const m = misionMap.get(a.id_mision)
    const key = m ? `${m.municipio} — ${m.direccion}` : a.id_mision
    if (!c[key]) c[key] = { personal: 0, atendidos: 0, lista: [] }
    c[key].atendidos++
  }
  return Object.entries(c).map(([mision, data]) => ({ mision, ...data }))
})

const especialidades = computed(() => {
  const c: Record<string, number> = {}
  for (const p of props.personales) {
    const esp = p.especialidad || 'Sin especificar'
    c[esp] = (c[esp] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
})

const hasData = computed(() => props.personales.length > 0)

function labelCategoria(val: string): string {
  return val === 'estudiante' ? 'Estudiante' : val === 'profesional' ? 'Profesional' : 'Voluntario'
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Personal Desplegado</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen</h2>
      <table class="info-table">
        <tr><td class="info-label">Total de personas desplegadas</td><td class="info-value">{{ totalPersonas }}</td></tr>
        <tr><td class="info-label">Asignaciones a misiones</td><td class="info-value">{{ props.personales.length }}</td></tr>
        <tr><td class="info-label">Misiones con personal</td><td class="info-value">{{ porMision.length }}</td></tr>
        <tr><td class="info-label">Total de atenciones realizadas</td><td class="info-value">{{ props.atendidos.length }}</td></tr>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Composición por Categoría</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th class="text-center">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[cat, cant] in porCategoria" :key="cat">
            <td>{{ labelCategoria(cat) }}</td>
            <td class="text-center">{{ cant }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="especialidades.length > 0" class="report-section">
      <h2 class="section-title">Especialidades</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Especialidad</th>
            <th class="text-center">Personas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[esp, cant] in especialidades" :key="esp">
            <td>{{ esp }}</td>
            <td class="text-center">{{ cant }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Personal por Misión</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Misión</th>
            <th class="text-center">Personal</th>
            <th class="text-center">Atendidos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in porMision" :key="r.mision">
            <td>{{ r.mision }}</td>
            <td class="text-center">{{ r.personal }}</td>
            <td class="text-center">{{ r.atendidos }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Personal Desplegado</h1>
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
