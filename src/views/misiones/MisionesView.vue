<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
const cargando = ref(true)

const misionColumns = [
  { key: 'direccion', label: 'Dirección' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'fecha_inicio', label: 'Fecha' },
  { key: 'estatus_mision', label: 'Estatus' },
  { key: 'acciones', label: 'Acciones' },
]

onMounted(async () => {
  try {
    await misionesStore.load()
  } catch {
    // error silencioso
  }
  cargando.value = false
})
</script>

<template>
  <div v-if="cargando" class="py-12 text-center text-text-secondary">
    <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
    <p>Cargando misiones...</p>
  </div>
  <div v-else class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
