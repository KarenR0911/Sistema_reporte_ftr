<script setup lang="ts">
import { computed } from 'vue'
import type { Mision, Atendido, PersonalMision } from '@/types'

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
  personales: PersonalMision[]
  titulo?: string
}>()

const veterinarios = computed(() => props.atendidos.filter((a) => a.area_registro === 'veterinaria'))
const hasData = computed(() => veterinarios.value.length > 0)
const total = computed(() => veterinarios.value.length)
const misionesConCasos = computed(() => new Set(veterinarios.value.map((a) => a.id_mision)).size)
const especiesDistintas = computed(() => new Set(veterinarios.value.map((a) => a.especie).filter(Boolean)).size)

function pct(part: number): number {
  return total.value ? Math.round((part / total.value) * 100) : 0
}

const porEspecie = computed(() => {
  const c: Record<string, number> = {}
  for (const a of veterinarios.value) {
    const k = (a.especie || 'Sin especificar').toLowerCase()
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((x, y) => y[1] - x[1])
    .map(([k, v]) => ({ especie: k.charAt(0).toUpperCase() + k.slice(1), cantidad: v }))
})

const porSexo = computed(() => {
  const c: Record<string, number> = {}
  for (const a of veterinarios.value) {
    const k = a.sexo === 'masculino' ? 'Macho' : a.sexo === 'femenino' ? 'Hembra' : null
    if (!k) continue
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((x, y) => y[1] - x[1])
    .map(([k, v]) => ({ sexo: k, cantidad: v }))
})

const gruposEdad = computed(() => {
  const g: Record<string, number> = { '0-1': 0, '2-5': 0, '6-10': 0, '11+': 0 }
  for (const a of veterinarios.value) {
    const e = a.edad
    if (e == null) continue
    if (e <= 1) g['0-1']!++
    else if (e <= 5) g['2-5']!++
    else if (e <= 10) g['6-10']!++
    else g['11+']!++
  }
  return Object.entries(g).map(([k, v]) => ({ grupo: k, cantidad: v }))
})

const porDiagnostico = computed(() => {
  const c: Record<string, number> = {}
  for (const a of veterinarios.value) {
    const k = (a.diagnostico_tentativo || 'Sin diagnóstico').trim().toLowerCase()
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((x, y) => y[1] - x[1])
    .map(([k, v]) => ({ diagnostico: k.charAt(0).toUpperCase() + k.slice(1), cantidad: v }))
})

const conTutor = computed(() => veterinarios.value.filter((a) => a.posee_tutor).length)
const rescatados = computed(() => veterinarios.value.filter((a) => a.rescatado).length)
const enAdopcion = computed(() => veterinarios.value.filter((a) => a.en_adopcion).length)

const porMision = computed(() => {
  const c = new Map<string, Atendido[]>()
  for (const a of veterinarios.value) {
    if (!c.has(a.id_mision)) c.set(a.id_mision, [])
    c.get(a.id_mision)!.push(a)
  }
  return [...c.entries()].map(([id, items]) => {
    const m = props.misiones.find((mm) => mm.id === id)
    return {
      mision: m ? `${m.municipio}, ${m.estado}` : 'Misión no encontrada',
      direccion: m?.direccion ?? '—',
      cantidad: items.length,
    }
  }).sort((x, y) => y.cantidad - x.cantidad)
})

const listado = computed(() =>
  [...veterinarios.value].sort((a, b) => (a.fecha_hora_atencion ?? '').localeCompare(b.fecha_hora_atencion ?? '')),
)

function registradoPor(a: Atendido): string {
  return props.personales.find((p) => p.cedula === a.cedula_personal)?.nombre ?? a.cedula_personal
}

function misionNombre(id: string): string {
  const m = props.misiones.find((mm) => mm.id === id)
  return m ? `${m.municipio}, ${m.estado}` : '—'
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function siNo(v: boolean | null | undefined): string {
  return v ? 'Sí' : 'No'
}
</script>

<template>
  <div v-if="hasData" class="report">
    <div class="report-header">
      <h1 class="report-title">{{ titulo || 'Reporte Veterinario' }}</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Resumen</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Total de animales atendidos</td><td class="info-value">{{ total }}</td></tr>
          <tr><td class="info-label">Misiones con casos</td><td class="info-value">{{ misionesConCasos }}</td></tr>
          <tr><td class="info-label">Especies distintas</td><td class="info-value">{{ especiesDistintas }}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Por Especie</h2>
      <table class="data-table">
        <thead><tr><th>Especie</th><th class="text-center">Cantidad</th></tr></thead>
        <tbody>
          <tr v-for="r in porEspecie" :key="r.especie">
            <td>{{ r.especie }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Sexo y Edad</h2>
      <table class="data-table">
        <thead><tr><th>Sexo</th><th class="text-center">Cantidad</th></tr></thead>
        <tbody>
          <tr v-for="r in porSexo" :key="r.sexo">
            <td>{{ r.sexo }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
      <table class="data-table mt-4">
        <thead><tr><th>Grupo de edad (años)</th><th class="text-center">Cantidad</th></tr></thead>
        <tbody>
          <tr v-for="r in gruposEdad" :key="r.grupo">
            <td>{{ r.grupo }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Diagnóstico Tentativo</h2>
      <table class="data-table">
        <thead><tr><th>Diagnóstico</th><th class="text-center">Casos</th></tr></thead>
        <tbody>
          <tr v-for="r in porDiagnostico" :key="r.diagnostico">
            <td>{{ r.diagnostico }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Situación de los Animales</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Poseen tutor</td><td class="info-value">{{ conTutor }} ({{ pct(conTutor) }}%)</td></tr>
          <tr><td class="info-label">Rescatados</td><td class="info-value">{{ rescatados }} ({{ pct(rescatados) }}%)</td></tr>
          <tr><td class="info-label">En adopción</td><td class="info-value">{{ enAdopcion }} ({{ pct(enAdopcion) }}%)</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="porMision.length > 1" class="report-section">
      <h2 class="section-title">Casos por Misión</h2>
      <table class="data-table">
        <thead><tr><th>Misión</th><th>Dirección</th><th class="text-center">Animales</th></tr></thead>
        <tbody>
          <tr v-for="r in porMision" :key="r.mision">
            <td>{{ r.mision }}</td><td>{{ r.direccion }}</td><td class="text-center">{{ r.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">Listado Detallado ({{ listado.length }})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especie</th>
            <th>Sexo</th>
            <th>Edad</th>
            <th>Diagnóstico</th>
            <th>Tutor</th>
            <th>Misión</th>
            <th>Fecha</th>
            <th>Registrado por</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in listado" :key="a.id">
            <td>{{ a.nombre_atendido }}</td>
            <td>{{ a.especie || '—' }}</td>
            <td class="text-center">{{ a.sexo === 'masculino' ? 'M' : a.sexo === 'femenino' ? 'F' : '—' }}</td>
            <td class="text-center">{{ a.edad ?? '—' }}</td>
            <td>{{ a.diagnostico_tentativo || '—' }}</td>
            <td class="text-center">{{ a.posee_tutor == null ? '—' : siNo(a.posee_tutor) }}</td>
            <td>{{ misionNombre(a.id_mision) }}</td>
            <td>{{ formatDateTime(a.fecha_hora_atencion) }}</td>
            <td>{{ registradoPor(a) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="report">
    <div class="report-header">
      <h1 class="report-title">{{ titulo || 'Reporte Veterinario' }}</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) }}</p>
    </div>
    <p class="text-text-secondary text-sm italic text-center py-8">No hay datos veterinarios disponibles.</p>
  </div>
</template>

<style scoped>
.report {
  font-family: 'Inria Sans', Arial, sans-serif;
  color: #333;
  max-width: 210mm;
  margin: 0 auto;
  padding: 40px 32px;
}

.report-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 3px solid #00244D;
}

.report-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #00244D;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.report-date {
  margin: 8px 0 0;
  font-size: 12px;
  color: #666;
}

.report-section {
  margin-bottom: 28px;
  page-break-inside: avoid;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #00244D;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 6px;
  border-bottom: 2px solid #145CAD;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
}

.info-table td {
  padding: 6px 12px;
  font-size: 13px;
}

.info-label {
  width: 240px;
  font-weight: 600;
  color: #666;
  vertical-align: top;
}

.info-value {
  color: #333;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  background-color: #F0F0F0;
  color: #00244D;
  font-weight: 600;
  text-align: left;
  padding: 8px 10px;
  border-bottom: 2px solid #BEBEBE;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.data-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #E3E3E3;
  vertical-align: top;
}

.data-table tbody tr:nth-child(even) {
  background-color: #FAFAFA;
}

.text-center {
  text-align: center;
}

.mt-4 {
  margin-top: 16px;
}
</style>
