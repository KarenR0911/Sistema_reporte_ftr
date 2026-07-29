<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { Mision, Atendido, Necesidad, PersonalMision } from '@/types'

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const props = defineProps<{
  misiones: Mision[]
  atendidos: Atendido[]
  necesidades: Necesidad[]
  personales: PersonalMision[]
}>()

const palette = {
  blue: '#145CAD', blueLight: '#1FAAE1', bluePale: '#68B1ED',
  mint: '#8FBFBF', brand: '#00244D', amber: '#F5A623',
  green: '#4CAF50', red: '#E53935', pink: '#E91E63',
  purple: '#7B1FA2', orange: '#FF9800', teal: '#009688', grey: '#9E9E9E',
}

const barOpts = {
  responsive: true, maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    x: { ticks: { font: { size: 11 } } },
  },
}

const hbarOpts = {
  responsive: true, maintainAspectRatio: true,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    y: { ticks: { font: { size: 11 } } },
  },
}

const semanas = ['-8 sem', '-7 sem', '-6 sem', '-5 sem', '-4 sem', '-3 sem', '-2 sem', '-1 sem', 'Esta sem']

const actividadReciente = computed(() => {
  const now = new Date()
  const inicio = new Date(now)
  inicio.setDate(inicio.getDate() - inicio.getDay() - 56)
  const counts = { atenciones: Array.from<number>({ length: 9 }, () => 0), misiones: Array.from<number>({ length: 9 }, () => 0), necesidades: Array.from<number>({ length: 9 }, () => 0) }

  for (const a of props.atendidos) {
    if (!a.fecha_hora_atencion) continue
    const d = new Date(a.fecha_hora_atencion)
    const diff = Math.floor((now.getTime() - d.getTime()) / (7 * 86400000))
    if (diff >= 0 && diff < 9) counts.atenciones[8 - diff]++
  }
  for (const m of props.misiones) {
    if (!m.fecha_inicio) continue
    const d = new Date(m.fecha_inicio)
    const diff = Math.floor((now.getTime() - d.getTime()) / (7 * 86400000))
    if (diff >= 0 && diff < 9) counts.misiones[8 - diff]++
  }
  for (const n of props.necesidades) {
    if (!n.created_at && !(n as any).fecha_reporte) continue
    const d = new Date((n as any).created_at ?? (n as any).fecha_reporte)
    const diff = Math.floor((now.getTime() - d.getTime()) / (7 * 86400000))
    if (diff >= 0 && diff < 9) counts.necesidades[8 - diff]++
  }

  return {
    labels: semanas,
    datasets: [
      { label: 'Atenciones', data: counts.atenciones, backgroundColor: palette.blue, borderRadius: 3 },
      { label: 'Misiones', data: counts.misiones, backgroundColor: palette.blueLight, borderRadius: 3 },
      { label: 'Necesidades', data: counts.necesidades, backgroundColor: palette.mint, borderRadius: 3 },
    ],
  }
})

const cargaVoluntarios = computed(() => {
  const c: Record<string, { nombre: string; count: number }> = {}
  for (const a of props.atendidos) {
    const cedula = a.cedula_personal
    if (!c[cedula]) {
      const p = props.personales.find(p2 => p2.cedula === cedula && p2.id_mision === a.id_mision)
      c[cedula] = { nombre: p?.nombre ?? cedula, count: 0 }
    }
    c[cedula].count++
  }
  const sorted = Object.entries(c)
    .map(([, v]) => v)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  return {
    labels: sorted.map(v => v.nombre.length > 18 ? v.nombre.slice(0, 16) + '...' : v.nombre),
    datasets: [{
      label: 'Atenciones',
      data: sorted.map(v => v.count),
      backgroundColor: palette.blueLight,
      borderRadius: 4,
    }],
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
    <div class="xl:col-span-3">
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Actividad Reciente (últimas 9 semanas)</h4>
        <div v-if="atendidos.length > 0 || misiones.length > 0 || necesidades.length > 0">
          <Bar :data="actividadReciente" :options="{ ...barOpts, scales: { ...barOpts.scales, y: { ...barOpts.scales.y, stacked: false } }, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } } }" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

    <div class="md:col-span-2 xl:col-span-2">
      <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light p-6">
        <h4 class="mb-3 pb-3 border-b border-surface text-base font-bold text-brand">Carga por Voluntario (Top 10)</h4>
        <div v-if="atendidos.length > 0">
          <Bar :data="cargaVoluntarios" :options="hbarOpts" />
        </div>
        <div v-else class="text-text-secondary text-sm italic text-center py-4">Sin datos</div>
      </div>
    </div>

  </div>
</template>
