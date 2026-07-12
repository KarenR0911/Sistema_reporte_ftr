<script setup lang="ts">
import { onMounted, computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const misionesStore = useMisionesStore()
const auth = useAuthStore()
const router = useRouter()

const role = computed(() => auth.userRole)

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha' },
  { key: 'estatus_mision', label: 'Estatus' },
  { key: 'status_sync', label: 'Sync' },
  { key: 'acciones', label: 'Acciones' },
]

onMounted(() => {
  misionesStore.load()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl text-brand m-0">Misiones</h1>
      <BaseButton variant="primary" @click="router.push('/misiones/nueva')">
        + Nueva Misión
      </BaseButton>
    </div>

    <BaseCard title="Todas las Misiones">
      <BaseTable :columns="misionColumns" :rows="misionesStore.list as unknown as Record<string, unknown>[]">
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" type="mision" />
        </template>
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" type="sync" />
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex gap-1">
            <BaseButton size="sm" variant="ghost" @click="router.push(`/misiones/${(row as any).id}`)">
              Gestionar
            </BaseButton>
            <BaseButton size="sm" variant="ghost" @click="router.push(`/misiones/${(row as any).id}/necesidades`)">
              Necesidades
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>
