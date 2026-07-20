<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { Rocket, CheckCircle, User, Package, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useInsumosStore } from '@/stores/insumos'
import { usePersonalStore } from '@/stores/personal'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()
const insumosStore = useInsumosStore()
const personalStore = usePersonalStore()
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
    )
  }

  loads.push(atendidosStore.load(), personalStore.load())

  try {
    await Promise.all(loads)
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
        <span class="text-4xl font-extrabold text-brand">{{ totalAtendidos }}</span>
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
          <StatusBadge :status="value as string" type="mision" />
        </template>
      </BaseTable>
      <div class="mt-4" v-if="role === 'director' || role === 'administrador' || role === 'coordinador'">
        <BaseButton variant="primary" @click="router.push('/misiones')">Ver todas las misiones</BaseButton>
      </div>
    </BaseCard>

    <!-- Coordinator: missions summary -->
    <BaseCard v-if="role === 'coordinador'" title="Misiones">
      <BaseTable
        :columns="misionColumns"
        :rows="misionesStore.list.slice(-5) as unknown as Record<string, unknown>[]"
      >
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" type="mision" />
        </template>
      </BaseTable>
      <div class="flex gap-2 mt-4">
        <BaseButton variant="primary" @click="router.push('/misiones')">Ver todas</BaseButton>
        <BaseButton variant="secondary" @click="router.push('/misiones/nueva')">Nueva Misión</BaseButton>
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
          { key: 'tipo_atencion', label: 'Tipo' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
          { key: 'status_sync', label: 'Sync' },
        ]"
        :rows="misAtenciones.slice(-10).reverse() as unknown as Record<string, unknown>[]"
      >
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" type="sync" />
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>
