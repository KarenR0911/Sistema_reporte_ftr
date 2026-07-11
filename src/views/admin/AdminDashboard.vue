<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useInsumosStore } from '@/stores/insumos'
import { getAll } from '@/db'
import type { Usuario } from '@/types'

const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()
const insumosStore = useInsumosStore()

const usuarios = ref<Usuario[]>([])

const totalMisiones = computed(() => misionesStore.list.length)
const totalAtendidos = computed(() => atendidosStore.list.length)
const totalNecesidades = computed(() => necesidadesStore.list.filter(n => n.estatus !== 'atendido').length)

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha Inicio' },
  { key: 'estatus_mision', label: 'Estatus' },
  { key: 'status_sync', label: 'Sincronización' },
]

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    atendidosStore.load(),
    necesidadesStore.load(),
    insumosStore.load(),
    getAll<Usuario>('usuarios').then((u) => { usuarios.value = u }),
  ])
})
</script>

<template>
  <div class="admin-dashboard">
    <h1 class="page-title">Panel de Administración</h1>

    <div class="stats-grid">
      <BaseCard class="stat-card">
        <div class="stat-icon">🚀</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalMisiones }}</span>
          <span class="stat-label">Misiones</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalAtendidos }}</span>
          <span class="stat-label">Personas Atendidas</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalNecesidades }}</span>
          <span class="stat-label">Necesidades Pendientes</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <span class="stat-number">{{ usuarios.length }}</span>
          <span class="stat-label">Usuarios Registrados</span>
        </div>
      </BaseCard>
    </div>

    <BaseCard title="Misiones Registradas">
      <BaseTable :columns="misionColumns" :rows="misionesStore.list as unknown as Record<string, unknown>[]">
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" type="mision" />
        </template>
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" type="sync" />
        </template>
      </BaseTable>
    </BaseCard>

    <BaseCard title="Últimas Atenciones">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Atendido' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
        ]"
        :rows="atendidosStore.list.slice(-10).reverse() as unknown as Record<string, unknown>[]"
      />
    </BaseCard>
  </div>
</template>

<style scoped>
.admin-dashboard { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; }
.stat-icon { font-size: 2rem; }
.stat-info { display: flex; flex-direction: column; }
.stat-number { font-size: 1.8rem; font-weight: 800; color: #00244D; }
.stat-label { font-size: 0.85rem; color: #666; }
</style>
