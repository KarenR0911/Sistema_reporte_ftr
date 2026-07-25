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
import type { Atendido, InsumoLlevado, Necesidad, PersonalMision } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const props = defineProps<{
  atendidos: Atendido[]
  insumos: InsumoLlevado[]
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

const categoryColors = [
  palette.blue, palette.blueLight, palette.mint, palette.amber,
  palette.green, palette.pink, palette.purple, palette.teal,
  palette.orange, palette.red,
]

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 12,
        font: { size: 11 },
      },
    },
  },
}

const tipoAtencionLabels: Record<string, string> = {
  medica: 'Médica',
  psicosocial: 'Psicosocial',
  alimento: 'Alimentación',
  refugio: 'Refugio',
  higiene: 'Higiene',
  informacion: 'Orientación',
  traslado: 'Traslado',
  otro: 'Otro',
}

const atencionPorTipo = computed(() => {
  const counts: Record<string, number> = {}
  for (const a of props.atendidos) {
    const key = a.tipo_atencion ?? 'otro'
    counts[key] = (counts[key] || 0) + 1
  }
  const labels = Object.keys(counts).map((k) => tipoAtencionLabels[k] ?? k)
  return {
    labels,
    datasets: [{
      data: Object.values(counts),
      backgroundColor: categoryColors.slice(0, labels.length),
      borderWidth: 0,
    }],
  }
})

const sexoLabels: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
}

const atendidosPorSexo = computed(() => {
  const counts: Record<string, number> = {}
  for (const a of props.atendidos) {
    const key = a.sexo ?? 'otro'
    counts[key] = (counts[key] || 0) + 1
  }
  const labels = Object.keys(counts).map((k) => sexoLabels[k] ?? k)
  return {
    labels,
    datasets: [{
      data: Object.values(counts),
      backgroundColor: [palette.blueLight, palette.pink, palette.grey],
      borderWidth: 0,
    }],
  }
})

const ageGroups = computed(() => {
  const grupos: { [key: string]: number } = {
    '0-12': 0, '13-17': 0, '18-30': 0, '31-50': 0, '51+': 0,
  }
  for (const a of props.atendidos) {
    const edad = a.edad
    if (edad == null) continue
    if (edad <= 12) grupos['0-12']!++
    else if (edad <= 17) grupos['13-17']!++
    else if (edad <= 30) grupos['18-30']!++
    else if (edad <= 50) grupos['31-50']!++
    else grupos['51+']!++
  }
  return {
    labels: Object.keys(grupos),
    datasets: [{
      label: 'Personas',
      data: Object.values(grupos),
      backgroundColor: [palette.bluePale, palette.blueLight, palette.blue, palette.brand, palette.mint],
      borderRadius: 4,
    }],
  }
})

const prioridadColors: Record<string, string> = {
  baja: palette.green,
  media: palette.amber,
  alta: palette.orange,
  critica: palette.red,
}

const necesidadesPorPrioridad = computed(() => {
  const counts: Record<string, number> = {}
  for (const n of props.necesidades) {
    counts[n.prioridad] = (counts[n.prioridad] || 0) + 1
  }
  return {
    labels: Object.keys(counts).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      label: 'Necesidades',
      data: Object.values(counts),
      backgroundColor: Object.keys(counts).map((k) => prioridadColors[k] ?? palette.grey),
      borderRadius: 4,
    }],
  }
})

const insumosPorEstatus = computed(() => {
  const entregado = props.insumos.filter((i) => i.estatus_cargamento === 'entregado').length
  const retorno = props.insumos.filter((i) => i.estatus_cargamento === 'retorno').length
  return {
    labels: ['Entregado', 'Retorno'],
    datasets: [{
      data: [entregado, retorno],
      backgroundColor: [palette.green, palette.amber],
      borderWidth: 0,
    }],
  }
})

const catVolLabels: Record<string, string> = {
  estudiante: 'Estudiante',
  profesional: 'Profesional',
  voluntario: 'Voluntario',
}

const personalPorCategoria = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of props.personales) {
    const key = p.categoria_voluntariado ?? 'voluntario'
    counts[key] = (counts[key] || 0) + 1
  }
  const labels = Object.keys(counts).map((k) => catVolLabels[k] ?? k)
  return {
    labels,
    datasets: [{
      data: Object.values(counts),
      backgroundColor: [palette.blueLight, palette.mint, palette.bluePale],
      borderWidth: 0,
    }],
  }
})

const hasAnyData = computed(() =>
  props.atendidos.length > 0 || props.insumos.length > 0
  || props.necesidades.length > 0 || props.personales.length > 0,
)
</script>

<template>
  <div v-if="hasAnyData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-if="atendidos.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Atenciones por tipo</h4>
      <div class="w-full max-w-52">
        <Doughnut :data="atencionPorTipo" :options="defaultOptions" />
      </div>
    </div>
    <div v-if="atendidos.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Atendidos por sexo</h4>
      <div class="w-full max-w-52">
        <Doughnut :data="atendidosPorSexo" :options="defaultOptions" />
      </div>
    </div>
    <div v-if="atendidos.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Grupos etarios</h4>
      <div class="w-full">
        <Bar :data="ageGroups" :options="{
          ...defaultOptions,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
            x: { ticks: { font: { size: 11 } } },
          },
        }" />
      </div>
    </div>
    <div v-if="necesidades.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Necesidades por prioridad</h4>
      <div class="w-full">
        <Bar :data="necesidadesPorPrioridad" :options="{
          ...defaultOptions,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
            x: { ticks: { font: { size: 11 } } },
          },
        }" />
      </div>
    </div>
    <div v-if="insumos.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Insumos: Entregado vs Retorno</h4>
      <div class="w-full max-w-52">
        <Doughnut :data="insumosPorEstatus" :options="defaultOptions" />
      </div>
    </div>
    <div v-if="personales.length > 0" class="flex flex-col items-center">
      <h4 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Personal por categoría</h4>
      <div class="w-full max-w-52">
        <Doughnut :data="personalPorCategoria" :options="defaultOptions" />
      </div>
    </div>
  </div>
  <div v-else class="text-text-secondary text-sm italic text-center py-4">
    No hay datos disponibles para mostrar estadísticas.
  </div>
</template>
