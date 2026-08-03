<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import GlobalCharts from '@/components/charts/GlobalCharts.vue'
import AdminCharts from '@/components/charts/AdminCharts.vue'
import { Rocket, CheckCircle, User, Package, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useInsumosStore } from '@/stores/insumos'
import { usePersonalStore } from '@/stores/personal'
import { useSalidasInsumosStore } from '@/stores/salidasInsumos'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()
const insumosStore = useInsumosStore()
const personalStore = usePersonalStore()
const salidasInsumosStore = useSalidasInsumosStore()
const router = useRouter()

const role = computed(() => auth.userRole)
const cargando = ref(true)
const misMisionIds = ref<Set<string>>(new Set())
const currentCedula = computed(() => auth.currentUser?.cedula ?? '')
const misAtenciones = computed(() =>
  atendidosStore.list.filter((a) => a.cedula_personal === currentCedula.value),
)
const misMisionesActivas = computed(() =>
  misionesStore.list.filter((m) => misMisionIds.value.has(m.id) && m.estatus_mision === 'activa'),
)
const totalMisiones = computed(() => misionesStore.list.length)
const totalAtendidos = computed(() => atendidosStore.list.length)
const totalNecesidades = computed(() => necesidadesStore.list.length)
const misionesActivas = computed(() =>
  misionesStore.list.filter((m) => m.estatus_mision === 'activa').length,
)

const areaLabels: Record<string, string> = {
  general: 'General', medicina_humana: 'Medicina Humana',
  psicologia: 'Psicología', veterinaria: 'Veterinaria', logistica: 'Logística',
}

const atendidosPorArea = computed(() => {
  const c: Record<string, number> = {}
  for (const a of atendidosStore.list) {
    const k = a.area_registro || 'general'
    c[k] = (c[k] || 0) + 1
  }
  return Object.entries(c).sort((a, b) => b[1] - a[1])
})

const rendimientoMisiones = computed(() => {
  const personalCount = new Map<string, number>()
  for (const p of personalStore.list) {
    personalCount.set(p.id_mision, (personalCount.get(p.id_mision) ?? 0) + 1)
  }
  const atendidosCount = new Map<string, number>()
  for (const a of atendidosStore.list) {
    atendidosCount.set(a.id_mision, (atendidosCount.get(a.id_mision) ?? 0) + 1)
  }
  const necCount = new Map<string, number>()
  for (const n of necesidadesStore.list) {
    necCount.set(n.id_mision, (necCount.get(n.id_mision) ?? 0) + 1)
  }
  return misionesStore.list.map(m => ({
    id: m.id,
    direccion: m.direccion,
    municipio: m.municipio,
    fecha: m.fecha_inicio,
    personal: personalCount.get(m.id) ?? 0,
    atendidos: atendidosCount.get(m.id) ?? 0,
    necesidades: necCount.get(m.id) ?? 0,
    estatus: m.estatus_mision,
  }))
})

const rendimientoColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'personal', label: 'Personal' },
  { key: 'atendidos', label: 'Atendidos' },
  { key: 'necesidades', label: 'Nec. Reportadas' },
  { key: 'estatus', label: 'Estatus' },
]

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha' },
  { key: 'estatus_mision', label: 'Estatus' },
]

onMounted(async () => {
  const loads: Promise<void>[] = [misionesStore.load()]

  if (role.value === 'director' || role.value === 'administrador') {
    loads.push(
      necesidadesStore.load(),
      insumosStore.load(),
      salidasInsumosStore.load(),
    )
  }

  loads.push(atendidosStore.load(), personalStore.load())

  const forceRender = setTimeout(() => { cargando.value = false }, 5000)

  try {
    await Promise.all(loads)
    clearTimeout(forceRender)
  } catch {
    // error silencioso
  }
  cargando.value = false

  const cedula = auth.currentUser?.cedula
  if (cedula) {
    const misAsignaciones = personalStore.list.filter((p) => p.cedula === cedula)
    misMisionIds.value = new Set(misAsignaciones.map((p) => p.id_mision))
  }
})
</script>

<template>
  <div>
    <div v-if="cargando" class="py-12 text-center text-text-secondary">
      <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>Cargando panel...</p>
    </div>
    <div v-else class="flex flex-col gap-4 md:gap-6">
    <h1 class="text-2xl text-brand m-0">Panel {{ role === 'director' ? 'del Director' : role === 'administrador' ? 'de Administración' : role === 'coordinador' ? 'del Coordinador' : 'de Voluntario' }}</h1>

    <!-- Stats Grid -->
    <div v-if="role === 'director' || role === 'administrador'" class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      <BaseCard class="flex items-center gap-4!">
        <div class="flex items-center text-primary"><Rocket :size="32" /></div>
        <div class="flex flex-col">
          <span class="text-3xl font-extrabold text-brand">{{ totalMisiones }}</span>
          <span class="text-sm text-text-secondary">Total Misiones</span>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4!">
        <div class="flex items-center text-primary"><CheckCircle :size="32" /></div>
        <div class="flex flex-col">
          <span class="text-3xl font-extrabold text-brand">{{ misionesActivas }}</span>
          <span class="text-sm text-text-secondary">Misiones Activas</span>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4!">
        <div class="flex items-center text-primary"><User :size="32" /></div>
        <div class="flex flex-col">
          <span class="text-3xl font-extrabold text-brand">{{ totalAtendidos }}</span>
          <span class="text-sm text-text-secondary">Atendidos</span>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-4!">
        <div class="flex items-center text-primary"><Package :size="32" /></div>
        <div class="flex flex-col">
          <span class="text-3xl font-extrabold text-brand">{{ totalNecesidades }}</span>
          <span class="text-sm text-text-secondary">Necesidades</span>
        </div>
      </BaseCard>
    </div>

    <div v-else class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      <BaseCard v-if="role === 'coordinador'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ totalMisiones }}</span>
        <span class="text-sm text-text-secondary">Total Misiones</span>
      </BaseCard>
      <BaseCard v-if="role === 'coordinador'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ misionesActivas }}</span>
        <span class="text-sm text-text-secondary">Misiones Activas</span>
      </BaseCard>
      <BaseCard v-if="role === 'coordinador'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ totalAtendidos }}</span>
        <span class="text-sm text-text-secondary">Personas Atendidas</span>
      </BaseCard>
      <BaseCard v-if="role === 'coordinador'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ totalNecesidades }}</span>
        <span class="text-sm text-text-secondary">Necesidades Reportadas</span>
      </BaseCard>
      <BaseCard v-if="role === 'personal'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ misMisionesActivas.length }}</span>
        <span class="text-sm text-text-secondary">Mis Misiones Activas</span>
      </BaseCard>
      <BaseCard v-if="role === 'personal'" class="flex flex-col items-center text-center gap-1!">
        <span class="text-4xl font-extrabold text-brand">{{ misAtenciones.length }}</span>
        <span class="text-sm text-text-secondary">Personas Atendidas</span>
      </BaseCard>
    </div>

    <!-- Misiones Recientes (director/admin) -->
    <BaseCard v-if="role === 'director' || role === 'administrador'" title="Misiones Recientes">
      <BaseTable
        :columns="misionColumns"
        :rows="misionesStore.list.slice(-5).reverse() as unknown as Record<string, unknown>[]"
      >
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" />
        </template>
      </BaseTable>
      <div class="mt-4" v-if="role === 'director' || role === 'administrador' || role === 'coordinador'">
        <BaseButton variant="primary" @click="router.push('/misiones')">Ver todas las misiones</BaseButton>
      </div>
    </BaseCard>

    <!-- Atendidos por Área (director/admin) -->
    <BaseCard v-if="(role === 'director' || role === 'administrador') && atendidosPorArea.length > 1" title="Registros por Área">
      <div class="flex flex-wrap gap-3">
        <div v-for="[area, count] in atendidosPorArea" :key="area" class="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg">
          <span class="text-lg font-bold text-brand">{{ count }}</span>
          <span class="text-sm text-text-secondary capitalize">{{ areaLabels[area] || area }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- Global Charts (director/admin) -->
    <div v-if="role === 'director' || role === 'administrador'">
      <h2 class="text-xl text-brand font-bold mb-2">Estadísticas Globales</h2>
      <GlobalCharts
        :misiones="misionesStore.list"
        :atendidos="atendidosStore.list"
        :insumos="insumosStore.list"
        :salidas="salidasInsumosStore.list"
        :necesidades="necesidadesStore.list"
        :personales="personalStore.list"
      />
    </div>

    <!-- Admin-only Charts -->
    <div v-if="role === 'administrador'">
      <h2 class="text-xl text-brand font-bold mb-2">Panel de Administración</h2>
      <AdminCharts
        :misiones="misionesStore.list"
        :atendidos="atendidosStore.list"
        :necesidades="necesidadesStore.list"
        :personales="personalStore.list"
      />
    </div>

    <!-- Rendimiento por Misión (director/admin) -->
    <BaseCard v-if="role === 'director' || role === 'administrador'" title="Rendimiento por Misión">
      <BaseTable
        :columns="rendimientoColumns"
        :rows="rendimientoMisiones as unknown as Record<string, unknown>[]"
      >
        <template #cell-personal="{ value }">
          <span class="font-semibold">{{ value }}</span>
        </template>
        <template #cell-atendidos="{ value }">
          <span class="font-semibold text-primary">{{ value }}</span>
        </template>
        <template #cell-necesidades="{ value }">
          <span>{{ value }}</span>
        </template>
        <template #cell-estatus="{ value }">
          <StatusBadge :status="value as string" />
        </template>
      </BaseTable>
    </BaseCard>

    <!-- Coordinator: missions summary -->
    <BaseCard v-if="role === 'coordinador'" title="Misiones">
      <BaseTable
        :columns="misionColumns"
        :rows="misionesStore.list.slice(-5) as unknown as Record<string, unknown>[]"
      >
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" />
        </template>
      </BaseTable>
      <div class="flex gap-2 mt-4">
        <BaseButton variant="primary" @click="router.push('/misiones')">Ver todas</BaseButton>
      </div>
    </BaseCard>

    <!-- Personal: my missions -->
    <BaseCard v-if="role === 'personal'" title="Mis Misiones Activas">
      <div v-if="misMisionesActivas.length === 0" class="py-8 text-center text-text-secondary italic">
        No estás asignado a ninguna misión activa.
      </div>
      <BaseTable
        v-else
        :columns="[
          { key: 'direccion', label: 'Dirección' },
          { key: 'municipio', label: 'Municipio' },
          { key: 'fecha_inicio', label: 'Fecha' },
          { key: 'accion', label: '' },
        ]"
        :rows="misMisionesActivas as unknown as Record<string, unknown>[]"
      >
        <template #cell-accion="{ row }">
          <BaseButton size="sm" variant="primary" @click="router.push(`/atencion/nueva/${(row as any).id}`)">
            Registrar Atención
          </BaseButton>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- Últimas Atenciones (personal) -->
    <BaseCard v-if="role === 'personal'" title="Mis Últimas Atenciones">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Atendido' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'area_registro', label: 'Área' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
          { key: 'status_sync', label: 'Sync' },
        ]"
        :rows="misAtenciones.slice(-10).reverse() as unknown as Record<string, unknown>[]"
      >
        <template #cell-area_registro="{ value }">
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{{ value || 'general' }}</span>
        </template>
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" />
        </template>
      </BaseTable>
    </BaseCard>
    </div>
  </div>
</template>
