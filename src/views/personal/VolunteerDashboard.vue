<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { usePersonalStore } from '@/stores/personal'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import { RouterView, useRouter } from 'vue-router'

const misionesStore = useMisionesStore()
const personalStore = usePersonalStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()
const router = useRouter()

const misMisionIds = ref<Set<string>>(new Set())

const misMisionesActivas = computed(() =>
  misionesStore.list.filter((m) => misMisionIds.value.has(m.id) && m.estatus_mision === 'activa'),
)

const totalAtendidos = computed(() => atendidosStore.list.length)

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha' },
  { key: 'accion', label: '' },
]

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    personalStore.load(),
    atendidosStore.load(),
  ])

  const cedula = auth.currentUser?.cedula
  if (cedula) {
    const misAsignaciones = personalStore.list.filter((p) => p.cedula === cedula)
    misMisionIds.value = new Set(misAsignaciones.map((p) => p.id_mision))
  }
})
</script>

<template>
  <div class="volunteer">
    <div v-if="$route.path === '/personal'" class="volunteer-dashboard">
      <h1 class="page-title">Panel de Voluntario</h1>

      <div class="stats-grid">
        <BaseCard class="stat-card">
          <span class="stat-number">{{ misMisionesActivas.length }}</span>
          <span class="stat-label">Mis Misiones Activas</span>
        </BaseCard>
        <BaseCard class="stat-card">
          <span class="stat-number">{{ totalAtendidos }}</span>
          <span class="stat-label">Personas Atendidas</span>
        </BaseCard>
      </div>

      <BaseCard title="Mis Misiones Activas">
        <div v-if="misMisionesActivas.length === 0" class="empty-state">
          No estás asignado a ninguna misión activa.
        </div>
        <BaseTable
          v-else
          :columns="misionColumns"
          :rows="misMisionesActivas as unknown as Record<string, unknown>[]"
        >
          <template #cell-accion="{ row }">
            <BaseButton
              size="sm"
              variant="primary"
              @click="router.push(`/personal/nueva-atencion/${(row as any).id}`)"
            >
              Registrar Atención
            </BaseButton>
          </template>
        </BaseTable>
      </BaseCard>

      <BaseCard title="Mis Últimas Atenciones">
        <BaseTable
          :columns="[
            { key: 'nombre_atendido', label: 'Atendido' },
            { key: 'cedula_atendido', label: 'Cédula' },
            { key: 'fecha_hora_atencion', label: 'Fecha' },
            { key: 'status_sync', label: 'Sync' },
          ]"
          :rows="atendidosStore.list.slice(-10).reverse() as unknown as Record<string, unknown>[]"
        >
          <template #cell-status_sync="{ value }">
            <StatusBadge :status="value as string" type="sync" />
          </template>
        </BaseTable>
      </BaseCard>
    </div>
    <RouterView v-else />
  </div>
</template>

<style scoped>
.volunteer-dashboard { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.stat-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
.stat-number { font-size: 2rem; font-weight: 800; color: #00244D; }
.stat-label { font-size: 0.85rem; color: #666; }
.empty-state { padding: 32px; text-align: center; color: #666; font-style: italic; }
</style>
