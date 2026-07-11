<script setup lang="ts">
import { onMounted, computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useRouter, RouterView } from 'vue-router'

const misionesStore = useMisionesStore()
const router = useRouter()

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha' },
  { key: 'estatus_mision', label: 'Estatus' },
  { key: 'status_sync', label: 'Sync' },
  { key: 'acciones', label: 'Acciones' },
]

const misionesActivas = computed(() =>
  misionesStore.list.filter((m) => m.estatus_mision === 'activa'),
)

onMounted(() => {
  misionesStore.load()
})
</script>

<template>
  <div class="coordinator">
    <div v-if="$route.path === '/coordinador'" class="coordinator-dashboard">
      <div class="header-row">
        <h1 class="page-title">Panel del Coordinador</h1>
        <RouterLink to="/coordinador/nueva-mision">
          <BaseButton variant="primary" size="lg">+ Nueva Misión</BaseButton>
        </RouterLink>
      </div>

      <div class="stats-grid">
        <BaseCard class="stat-card">
          <span class="stat-number">{{ misionesStore.list.length }}</span>
          <span class="stat-label">Total Misiones</span>
        </BaseCard>
        <BaseCard class="stat-card">
          <span class="stat-number">{{ misionesActivas.length }}</span>
          <span class="stat-label">Misiones Activas</span>
        </BaseCard>
      </div>

      <BaseCard title="Misiones">
        <BaseTable :columns="misionColumns" :rows="misionesStore.list as unknown as Record<string, unknown>[]">
          <template #cell-estatus_mision="{ value }">
            <StatusBadge :status="value as string" type="mision" />
          </template>
          <template #cell-status_sync="{ value }">
            <StatusBadge :status="value as string" type="sync" />
          </template>
          <template #cell-acciones="{ row }">
            <div class="action-btns">
              <BaseButton size="sm" variant="ghost" @click="router.push(`/coordinador/mision/${(row as any).id}`)">
                Gestionar
              </BaseButton>
              <BaseButton size="sm" variant="ghost" @click="router.push(`/coordinador/necesidades/${(row as any).id}`)">
                Necesidades
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </BaseCard>
    </div>
    <RouterView v-else />
  </div>
</template>

<style scoped>
.coordinator-dashboard { display: flex; flex-direction: column; gap: 24px; }
.header-row { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.stat-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
.stat-number { font-size: 2rem; font-weight: 800; color: #00244D; }
.stat-label { font-size: 0.85rem; color: #666; }
.action-btns { display: flex; gap: 4px; }
</style>
