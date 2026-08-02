<script setup lang="ts">
import type { Mision, Atendido, InsumoLlevado, Necesidad, PersonalMision, SalidaInsumo, Transporte } from '@/types'

const props = defineProps<{
  mission: Mision
  atendidos: Atendido[]
  insumos: InsumoLlevado[]
  necesidades: Necesidad[]
  personales: PersonalMision[]
  salidas: SalidaInsumo[]
  transportes: Transporte[]
}>()

function labelTipoAtencion(val: string | null): string {
  const labels: Record<string, string> = {
    medica: 'Médica / Primeros Auxilios',
    psicosocial: 'Apoyo Psicosocial',
    alimento: 'Alimentación / Hidratación',
    refugio: 'Refugio / Abrigo',
    higiene: 'Kits de Higiene',
    informacion: 'Orientación',
    traslado: 'Traslado / Evacuación',
    otro: 'Otro',
  }
  return val ? (labels[val] ?? val) : '—'
}

import { computed } from 'vue'

const areas = computed(() => {
  const map = new Map<string, Atendido[]>()
  for (const a of props.atendidos) {
    const area = a.area_registro || 'general'
    if (!map.has(area)) map.set(area, [])
    map.get(area)!.push(a)
  }
  return map
})

const areaLabels: Record<string, string> = {
  general: 'General', medicina_humana: 'Medicina Humana',
  psicologia: 'Psicología', veterinaria: 'Veterinaria', logistica: 'Logística',
}

function labelSexo(val: string | null): string {
  if (!val) return '—'
  return val === 'masculino' ? 'M' : val === 'femenino' ? 'F' : val
}

function insumoNombre(id: string): string {
  const ins = props.insumos.find((i) => i.id === id)
  return ins ? `${ins.categoria} — ${ins.descripcion}` : id.slice(0, 8)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}


</script>

<template>
  <div class="report">
    <div class="report-header">
      <h1 class="report-title">Reporte de Misión</h1>
      <p class="report-date">Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Datos de la Misión</h2>
      <table class="info-table">
        <tbody>
          <tr>
            <td class="info-label">Municipio / Estado</td>
            <td class="info-value">{{ mission.municipio }}, {{ mission.estado }}</td>
          </tr>
          <tr>
            <td class="info-label">Dirección</td>
            <td class="info-value">{{ mission.direccion }}</td>
          </tr>
          <tr>
            <td class="info-label">Fecha de inicio</td>
            <td class="info-value">{{ formatDate(mission.fecha_inicio) }}</td>
          </tr>
          <tr>
            <td class="info-label">Estatus</td>
            <td class="info-value">{{ mission.estatus_mision === 'activa' ? 'Activa' : mission.estatus_mision === 'completada' ? 'Completada' : 'Cancelada' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="transportes.length > 0" class="report-section">
      <h2 class="section-title">Transporte</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Placa</th>
            <th>Conductor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transportes" :key="t.numero_placa">
            <td>{{ t.tipo_transporte }}</td>
            <td>{{ t.numero_placa }}</td>
            <td>{{ t.nombre_conductor }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="personales.length > 0" class="report-section">
      <h2 class="section-title">Personal Asignado</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Especialidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in personales" :key="p.id">
            <td>{{ p.cedula }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.categoria_voluntariado }}</td>
            <td>{{ p.especialidad || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="atendidos.length > 0" class="report-section">
      <h2 class="section-title">Registros por Área ({{ atendidos.length }})</h2>
      <div v-for="[area, items] in areas" :key="area" class="mb-4">
        <h3 class="subsection-title">{{ areaLabels[area] || area }} ({{ items.length }})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th v-if="area !== 'veterinaria'">Cédula</th>
              <th v-if="area === 'veterinaria'">Especie</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th v-if="area === 'medicina_humana' || area === 'psicologia'">Motivo</th>
              <th v-if="area === 'logistica'">Insumo</th>
              <th v-if="area === 'veterinaria'">Diagnóstico</th>
              <th v-if="area === 'general'">Atención</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in items" :key="a.id">
              <td>{{ a.nombre_atendido }}</td>
              <td v-if="area !== 'veterinaria'">{{ a.cedula_atendido || '—' }}</td>
              <td v-if="area === 'veterinaria'">{{ a.especie || '—' }}</td>
              <td class="text-center">{{ a.edad ?? '—' }}</td>
              <td class="text-center">{{ labelSexo(a.sexo) }}</td>
              <td v-if="area === 'medicina_humana' || area === 'psicologia'">{{ a.motivo_atencion || '—' }}</td>
              <td v-if="area === 'logistica'">{{ a.insumo_entregado || '—' }}</td>
              <td v-if="area === 'veterinaria'">{{ a.diagnostico_tentativo || '—' }}</td>
              <td v-if="area === 'general'">{{ labelTipoAtencion(a.tipo_atencion) }}</td>
              <td class="notes-cell">{{ a.notas || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="insumos.length > 0 || salidas.length > 0" class="report-section">
      <h2 class="section-title">Insumos / Dispensación</h2>

      <div v-if="insumos.length > 0">
        <h3 class="subsection-title">Insumos llevados ({{ insumos.length }})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Unidad</th>
            </tr>
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

      <div v-if="salidas.length > 0" class="mt-4">
        <h3 class="subsection-title">Salidas de insumos ({{ salidas.length }})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Registrado por</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in salidas" :key="s.id">
              <td>{{ insumoNombre(s.id_insumo) }}</td>
              <td class="text-center">{{ s.cantidad }}</td>
              <td>{{ s.motivo || '—' }}</td>
              <td>{{ s.registrado_por }}</td>
              <td>{{ formatDateTime(s.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="necesidades.length > 0" class="report-section">
      <h2 class="section-title">Necesidades Reportadas ({{ necesidades.length }})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Cant. Requerida</th>
            <th>Unidad</th>
            <th>Prioridad</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in necesidades" :key="n.id">
            <td>{{ n.categoria }}</td>
            <td>{{ n.descripcion }}</td>
            <td class="text-center">{{ n.cantidad_requerida }}</td>
            <td class="text-center">{{ n.unidad }}</td>
            <td>{{ n.prioridad }}</td>
            <td>{{ n.estatus }}</td>
          </tr>
        </tbody>
      </table>
    </div>


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

.subsection-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
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
  width: 180px;
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

.notes-cell {
  max-width: 180px;
  font-size: 11px;
}

.summary-text {
  margin: 8px 0 0;
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.mt-4 {
  margin-top: 16px;
}
</style>
