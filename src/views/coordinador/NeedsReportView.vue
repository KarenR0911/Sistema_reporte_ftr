<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useNecesidadesStore } from '@/stores/necesidades'
import type { Necesidad } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const necesidadesStore = useNecesidadesStore()

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))
const necesidades = computed(() => necesidadesStore.getByMision(missionId))

const formCategoria = ref('')
const formDescripcion = ref('')
const formCantidad = ref('')
const formUnidad = ref('')
const formObservaciones = ref('')
const formPrioridad = ref('media')

async function addNecesidad() {
  const item: Necesidad = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    categoria: formCategoria.value,
    descripcion: formDescripcion.value,
    cantidad_requerida: Number(formCantidad.value) || 0,
    unidad: formUnidad.value,
    observaciones: formObservaciones.value,
    prioridad: formPrioridad.value as Necesidad['prioridad'],
    estatus: 'reportado',
    status_sync: 'pending',
  }
  await necesidadesStore.create(item)
  formCategoria.value = ''
  formDescripcion.value = ''
  formCantidad.value = ''
  formUnidad.value = ''
  formObservaciones.value = ''
  formPrioridad.value = 'media'
}

onMounted(async () => {
  await Promise.all([misionesStore.load(), necesidadesStore.load()])
})
</script>

<template>
  <div class="needs-report">
    <div class="header-row">
      <div>
        <h1 class="page-title">Levantamiento de Necesidades</h1>
        <p v-if="mission" class="mission-info">{{ mission.municipio }}, {{ mission.estado }} - {{ mission.direccion }}</p>
      </div>
      <BaseButton variant="ghost" @click="router.back()">Volver</BaseButton>
    </div>

    <BaseCard title="Registrar Necesidad">
      <div class="form-grid">
        <BaseInput v-model="formCategoria" label="Categoría" placeholder="Medicinas, Alimentos, Agua..." />
        <BaseInput v-model="formDescripcion" label="Descripción" />
        <BaseInput v-model="formCantidad" label="Cantidad Requerida" type="number" />
        <BaseInput v-model="formUnidad" label="Unidad" placeholder="kg, unidades, litros..." />
        <BaseInput v-model="formObservaciones" label="Observaciones" />
        <BaseSelect
          v-model="formPrioridad"
          label="Prioridad"
          :options="[
            { value: 'baja', label: 'Baja' },
            { value: 'media', label: 'Media' },
            { value: 'alta', label: 'Alta' },
            { value: 'critica', label: 'Crítica' },
          ]"
        />
      </div>
      <BaseButton variant="primary" @click="addNecesidad">Agregar Necesidad</BaseButton>
    </BaseCard>

    <BaseCard title="Necesidades Registradas">
      <BaseTable
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'cantidad_requerida', label: 'Cant.' },
          { key: 'unidad', label: 'Unidad' },
          { key: 'prioridad', label: 'Prioridad' },
          { key: 'estatus', label: 'Estatus' },
          { key: 'status_sync', label: 'Sync' },
        ]"
        :rows="necesidades as unknown as Record<string, unknown>[]"
      >
        <template #cell-prioridad="{ value }">
          <StatusBadge :status="value as string" />
        </template>
        <template #cell-estatus="{ value }">
          <StatusBadge :status="value as string" type="necesidad" />
        </template>
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" type="sync" />
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.needs-report { display: flex; flex-direction: column; gap: 24px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.mission-info { color: #666; margin: 4px 0 0; font-size: 0.9rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
</style>
