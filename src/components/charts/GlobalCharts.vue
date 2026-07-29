<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'
import type { Mision, Atendido, InsumoLlevado, SalidaInsumo, Necesidad, PersonalMision } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
  insumos: InsumoLlevado[]
  salidas: SalidaInsumo[]
  necesidades: Necesidad[]
  personales: PersonalMision[]
}>()

const palette = {
  blue: '#145CAD',
  blueLight: '#1FAAE1',
  bluePale: '#68B1ED',
  mint: '#8FBFBF',
  brand: '#00244D',
  amber: '#F5A623',
  green: '#4CAF50',
  red: '#E53935',
  pink: '#E91E63',
  purple: '#7B1FA2',
  orange: '#FF9800',
  teal: '#009688',
  grey: '#9E9E9E',
}

const catColors = [
  palette.blue, palette.blueLight, palette.mint, palette.amber,
  palette.green, palette.pink, palette.purple, palette.teal,
  palette.orange, palette.red,
]

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
    },
  },
}

const barOpts = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    x: { ticks: { font: { size: 11 } } },
  },
}

const hbarOpts = {
  responsive: true,
  maintainAspectRatio: true,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    y: { ticks: { font: { size: 11 } } },
  },
}

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const tipoLabels: Record<string, string> = {
  medica: 'Médica',
  psicosocial: 'Psicosocial',
  alimento: 'Alimentación',
  refugio: 'Refugio',
  higiene: 'Higiene',
  informacion: 'Orientación',
  traslado: 'Traslado',
  otro: 'Otro',
}

const estatusLabels: Record<string, string> = {
  reportado: 'Reportado',
  enproceso: 'En Proceso',
  atendido: 'Atendido',
}

const estatusColors: Record<string, string> = {
  reportado: palette.red,
  enproceso: palette.amber,
  atendido: palette.green,
}

const prioridadLabels: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}

const prioridadColors: Record<string, string> = {
  baja: palette.green,
  media: palette.amber,
  alta: palette.orange,
  critica: palette.red,
}

const catVolLabels: Record<string, string> = {
  estudiante: 'Estudiante',
  profesional: 'Profesional',
  voluntario: 'Voluntario',
}

const vulnLabels: Record<string, string> = {
  embarazada: 'Embarazada',
  discapacidad: 'Discapacidad',
  adulto_mayor: 'Adulto Mayor',
  menor_no_acompanado: 'Menor no Acompañado',
  enfermedad_cronica: 'Enfermedad Crónica',
  otro: 'Otro',
}

const misionesPorMes = computed(() => {
  const map: Record<string, { count: number; sortKey: string }> = {}
  for (const m of props.misiones) {
    if (!m.fecha_inicio) continue
    const d = new Date(m.fecha_inicio)
    const label = `${meses[d.getMonth()]} ${d.getFullYear()}`
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[label]) map[label] = { count: 0, sortKey }
    map[label].count++
  }
  const sorted = Object.entries(map).sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label: 'Misiones',
      data: sorted.map(([, v]) => v.count),
      backgroundColor: palette.blue,
      borderRadius: 4,
    }],
  }
})

const atencionPorTipo = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    const k = a.tipo_atencion ?? 'otro'
    c[k] = (c[k] || 0) + 1
  }
  const labels = Object.keys(c).map(k => tipoLabels[k] ?? k)
  return {
    labels,
    datasets: [{
      data: Object.values(c),
      backgroundColor: catColors.slice(0, labels.length),
      borderWidth: 0,
    }],
  }
})

const insumosGlobal = computed(() => {
  const salidasMap = new Map<string, number>()
  for (const s of props.salidas) {
    salidasMap.set(s.id_insumo, (salidasMap.get(s.id_insumo) ?? 0) + s.cantidad)
  }
  let llevado = 0
  let dispensado = 0
  for (const i of props.insumos) {
    const s = salidasMap.get(i.id) ?? 0
    llevado += i.cantidad
    dispensado += s
  }
  return {
    labels: ['Disponible', 'Dispensado'],
    datasets: [{
      data: [Math.max(0, llevado - dispensado), dispensado],
      backgroundColor: [palette.blue, palette.amber],
      borderWidth: 0,
    }],
  }
})

const necesidadesPorEstatus = computed(() => {
  const c: Record<string, number> = {}
  for (const n of props.necesidades) {
    c[n.estatus] = (c[n.estatus] || 0) + 1
  }
  return {
    labels: Object.keys(c).map(k => estatusLabels[k] ?? k),
    datasets: [{
      data: Object.values(c),
      backgroundColor: Object.keys(c).map(k => estatusColors[k] ?? palette.grey),
      borderWidth: 0,
    }],
  }
})

const personalPorCategoria = computed(() => {
  const c: Record<string, number> = {}
  for (const p of props.personales) {
    const k = p.categoria_voluntariado ?? 'voluntario'
    c[k] = (c[k] || 0) + 1
  }
  return {
    labels: Object.keys(c).map(k => catVolLabels[k] ?? k),
    datasets: [{
      data: Object.values(c),
      backgroundColor: [palette.blueLight, palette.mint, palette.bluePale],
      borderWidth: 0,
    }],
  }
})

const necesidadesPorPrioridad = computed(() => {
  const c: Record<string, number> = {}
  for (const n of props.necesidades) {
    c[n.prioridad] = (c[n.prioridad] || 0) + 1
  }
  return {
    labels: Object.keys(c).map(k => prioridadLabels[k] ?? k),
    datasets: [{
      label: 'Necesidades',
      data: Object.values(c),
      backgroundColor: Object.keys(c).map(k => prioridadColors[k] ?? palette.grey),
      borderRadius: 4,
    }],
  }
})

const vulnerabilidades = computed(() => {
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    if (!a.vulnerabilidad) continue
    try {
      const arr = JSON.parse(a.vulnerabilidad)
      if (Array.isArray(arr)) {
        for (const v of arr) {
          c[v] = (c[v] || 0) + 1
        }
      }
    } catch {
      // valor no es JSON array
    }
  }
  const sorted = Object.entries(c).sort((a, b) => b[1] - a[1])
  return {
    labels: sorted.map(([k]) => vulnLabels[k] ?? k),
    datasets: [{
      label: 'Personas',
      data: sorted.map(([, v]) => v),
      backgroundColor: [palette.pink, palette.purple, palette.teal, palette.orange, palette.red, palette.grey],
      borderRadius: 4,
    }],
  }
})

const atendidosPorMunicipio = computed(() => {
  const misionMap = new Map(props.misiones.map(m => [m.id, m]))
  const c: Record<string, number> = {}
  for (const a of props.atendidos) {
    const mun = misionMap.get(a.id_mision)?.municipio ?? 'Sin municipio'
    c[mun] = (c[mun] || 0) + 1
  }
  const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label: 'Atendidos',
      data: sorted.map(([, v]) => v),
      backgroundColor: catColors.slice(0, sorted.length),
      borderRadius: 4,
    }],
  }
})

const tieneVulnerabilidades = computed(() =>
  props.atendidos.some(a => {
    if (!a.vulnerabilidad) return false
    try {
      const arr = JSON.parse(a.vulnerabilidad)
      return Array.isArray(arr) && arr.length > 0
    } catch {
      return false
    }
  }),
)

const hasAnyData = computed(() =>
  props.misiones.length > 0 || props.atendidos.length > 0 || props.insumos.length > 0
  || props.necesidades.length > 0 || props.personales.length > 0,
)
</script>

<template>
  <div v-if="hasAnyData" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
    <div class="xl:col-span-2">
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Misiones por mes</h4>
        <div v-if="misiones.length > 0">
          <Bar :data="misionesPorMes" :options="barOpts" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Atendidos por tipo</h4>
        <div v-if="atendidos.length > 0" class="flex flex-col items-center">
          <div class="w-full max-w-48">
            <Doughnut :data="atencionPorTipo" :options="doughnutOpts" />
          </div>
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Insumos</h4>
        <div v-if="insumos.length > 0" class="flex flex-col items-center">
          <div class="w-full max-w-48">
            <Doughnut :data="insumosGlobal" :options="doughnutOpts" />
          </div>
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Nec. por estado</h4>
        <div v-if="necesidades.length > 0" class="flex flex-col items-center">
          <div class="w-full max-w-48">
            <Doughnut :data="necesidadesPorEstatus" :options="doughnutOpts" />
          </div>
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Personal por categoría</h4>
        <div v-if="personales.length > 0" class="flex flex-col items-center">
          <div class="w-full max-w-48">
            <Doughnut :data="personalPorCategoria" :options="doughnutOpts" />
          </div>
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Nec. por prioridad</h4>
        <div v-if="necesidades.length > 0">
          <Bar :data="necesidadesPorPrioridad" :options="barOpts" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div>
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Vulnerabilidades</h4>
        <div v-if="tieneVulnerabilidades">
          <Bar :data="vulnerabilidades" :options="barOpts" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div class="md:col-span-2 xl:col-span-3">
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Atendidos por municipio (Top 10)</h4>
        <div v-if="atendidos.length > 0" class="max-w-xl mx-auto">
          <Bar :data="atendidosPorMunicipio" :options="hbarOpts" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>
  </div>
  <div v-else class="text-text-secondary text-sm italic text-center py-4">
    No hay datos disponibles para mostrar estadísticas globales.
  </div>
</template>
