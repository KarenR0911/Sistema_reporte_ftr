<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { usePrint } from '@/composables/usePrint'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useInsumosStore } from '@/stores/insumos'
import { usePersonalStore } from '@/stores/personal'
import { useSalidasInsumosStore } from '@/stores/salidasInsumos'
import { useAuthStore } from '@/stores/auth'
import { FileText, MapPin, Target, Package, Users, Heart, Activity, PawPrint, type LucideIcon } from '@lucide/vue'
import ReporteDirector from '@/components/reports/ReporteDirector.vue'
import ReporteGeografico from '@/components/reports/ReporteGeografico.vue'
import ReporteEfectividad from '@/components/reports/ReporteEfectividad.vue'
import ReporteInsumos from '@/components/reports/ReporteInsumos.vue'
import ReportePersonal from '@/components/reports/ReportePersonal.vue'
import ReporteAtenciones from '@/components/reports/ReporteAtenciones.vue'
import ReporteActividadPersonal from '@/components/reports/ReporteActividadPersonal.vue'
import ReporteVeterinario from '@/components/reports/ReporteVeterinario.vue'

const auth = useAuthStore()
const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()
const insumosStore = useInsumosStore()
const personalStore = usePersonalStore()
const salidasStore = useSalidasInsumosStore()

const cargando = ref(true)
const { printing, printReport } = usePrint()
const reporteActivo = ref<string | null>(null)
const areaFiltro = ref('')

const role = computed(() => auth.userRole)
const esAdmin = computed(() => role.value === 'director' || role.value === 'administrador')

const areaOptions = [
  { value: '', label: 'Todas las áreas' },
  { value: 'general', label: 'General' },
  { value: 'medicina_humana', label: 'Medicina Humana' },
  { value: 'psicologia', label: 'Psicología' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'logistica', label: 'Logística' },
]

const areasConReportes = computed(() =>
  areaOptions.filter((a) => a.value === '' || reportesDisponibles.some((r) => r.area === a.value))
)

const atendidosFiltrados = computed(() => {
  if (!areaFiltro.value) return atendidosStore.list
  return atendidosStore.list.filter((a) => a.area_registro === areaFiltro.value)
})

interface ReporteInfo {
  id: string
  titulo: string
  desc: string
  icon: LucideIcon
  area: string
}

const reportesDisponibles: ReporteInfo[] = [
  { id: 'director', titulo: 'Reporte General del Director', desc: 'KPIs globales, resumen de rendimiento por misión y estadísticas generales del sistema.', icon: FileText, area: 'general' },
  { id: 'geografico', titulo: 'Cobertura Geográfica', desc: 'Personas atendidas por municipio, distribución geográfica de las misiones y porcentajes por zona.', icon: MapPin, area: 'general' },
  { id: 'efectividad', titulo: 'Efectividad — Necesidades', desc: 'Necesidades reportadas vs atendidas, tasa de atención, brechas críticas y prioridades pendientes.', icon: Target, area: 'general' },
  { id: 'insumos', titulo: 'Inventario de Insumos', desc: 'Insumos llevados vs dispensados, stock disponible por categoría y salidas por motivo.', icon: Package, area: 'general' },
  { id: 'personal', titulo: 'Personal Desplegado', desc: 'Personal asignado por misión, composición por categoría, especialidades y carga de trabajo.', icon: Users, area: 'general' },
  { id: 'atenciones', titulo: 'Atenciones Consolidado', desc: 'Atenciones por tipo, distribución por sexo y edad, vulnerabilidades identificadas y referencias.', icon: Heart, area: 'general' },
  { id: 'actividad-personal', titulo: 'Actividad del Personal', desc: 'Volumen de atenciones por voluntario, misiones en las que participó y última actividad registrada.', icon: Activity, area: 'general' },
  { id: 'veterinario', titulo: 'Reporte Veterinario', desc: 'Animales atendidos: especies, sexo y edad, diagnósticos, tutoría/adopción, casos por misión y listado detallado.', icon: PawPrint, area: 'veterinaria' },
]

const reportesVisibles = computed(() => {
  if (!esAdmin.value) return reportesDisponibles.filter((r) => r.id === 'veterinario')
  if (!areaFiltro.value) return reportesDisponibles
  return reportesDisponibles.filter((r) => r.area === areaFiltro.value)
})

function iniciarReporte(id: string) {
  reporteActivo.value = id
  printReport()
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    atendidosStore.load(),
    necesidadesStore.load(),
    insumosStore.load(),
    personalStore.load(),
    salidasStore.load(),
  ])
  cargando.value = false
})
</script>

<template>
  <div>
    <div v-if="cargando" class="py-12 text-center text-text-secondary">
      <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>Cargando datos...</p>
    </div>
    <div v-else class="flex flex-col gap-4 md:gap-6">
      <h1 class="text-2xl text-brand m-0">Centro de Reportes</h1>
      <p class="text-text-secondary text-sm">Selecciona un reporte para generar un documento PDF imprimible.</p>

      <div v-if="esAdmin" class="max-w-xs">
        <BaseSelect v-model="areaFiltro" :options="areasConReportes" label="Área" />
      </div>

      <div v-if="!reportesVisibles.length" class="py-10 text-center text-text-secondary text-sm">
        No hay reportes disponibles para el área seleccionada.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <BaseCard v-for="r in reportesVisibles" :key="r.id" class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="text-primary flex items-center"><component :is="r.icon" :size="24" /></span>
            <h3 class="m-0 text-sm font-bold text-brand">{{ r.titulo }}</h3>
          </div>
          <p class="text-xs text-text-secondary m-0 leading-relaxed">{{ r.desc }}</p>
          <div class="mt-auto pt-2">
            <BaseButton variant="primary" size="sm" @click="iniciarReporte(r.id)">
              <FileText :size="16" /> Generar PDF
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="printing" class="printing-overlay">
        <div class="no-print flex items-center justify-center min-h-screen bg-white">
          <div class="text-center py-20">
            <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p class="text-text-secondary">Preparando reporte para impresión...</p>
          </div>
        </div>
        <ReporteDirector
          v-if="reporteActivo === 'director'"
          :misiones="misionesStore.list"
          :atendidos="atendidosFiltrados"
          :necesidades="necesidadesStore.list"
          :personales="personalStore.list"
        />
        <ReporteGeografico
          v-if="reporteActivo === 'geografico'"
          :misiones="misionesStore.list"
          :atendidos="atendidosFiltrados"
        />
        <ReporteEfectividad
          v-if="reporteActivo === 'efectividad'"
          :misiones="misionesStore.list"
          :necesidades="necesidadesStore.list"
        />
        <ReporteInsumos
          v-if="reporteActivo === 'insumos'"
          :insumos="insumosStore.list"
          :salidas="salidasStore.list"
        />
        <ReportePersonal
          v-if="reporteActivo === 'personal'"
          :misiones="misionesStore.list"
          :personales="personalStore.list"
          :atendidos="atendidosFiltrados"
        />
        <ReporteAtenciones
          v-if="reporteActivo === 'atenciones'"
          :misiones="misionesStore.list"
          :atendidos="atendidosFiltrados"
        />
        <ReporteActividadPersonal
          v-if="reporteActivo === 'actividad-personal'"
          :misiones="misionesStore.list"
          :atendidos="atendidosFiltrados"
          :personales="personalStore.list"
        />
        <ReporteVeterinario
          v-if="reporteActivo === 'veterinario'"
          :misiones="misionesStore.list"
          :atendidos="atendidosFiltrados"
          :personales="personalStore.list"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.printing-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: white;
  overflow: auto;
}

@media print {
  .printing-overlay {
    position: static !important;
    overflow: visible !important;
    background: white !important;
  }
}
</style>
