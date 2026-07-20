<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { Plus, ArrowLeft } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useNecesidadesStore } from '@/stores/necesidades'
import { necesidadSchema } from '@/lib/schemas'
import type { Necesidad } from '@/types'
import { useLoading } from '@/composables/useLoading'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const necesidadesStore = useNecesidadesStore()
const { loading, withLoading, saving } = useLoading()

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))
const necesidades = computed(() => necesidadesStore.getByMision(missionId))

const formCategoria = ref('')
const formDescripcion = ref('')
const formCantidad = ref('')
const formUnidad = ref('')
const formObservaciones = ref('')
const formPrioridad = ref('media')
const formErrors = ref<Record<string, string>>({})

async function addNecesidad() {
  formErrors.value = {}
  const cantidad_requerida = Number(formCantidad.value) || 0
  const result = necesidadSchema.safeParse({
    categoria: formCategoria.value,
    descripcion: formDescripcion.value,
    cantidad_requerida,
    unidad: formUnidad.value,
    observaciones: formObservaciones.value,
    prioridad: formPrioridad.value,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }
  const item: Necesidad = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    categoria: formCategoria.value,
    descripcion: formDescripcion.value,
    cantidad_requerida,
    unidad: formUnidad.value,
    observaciones: formObservaciones.value,
    prioridad: formPrioridad.value as Necesidad['prioridad'],
    estatus: 'reportado',
    status_sync: 'pending',
  }
  await withLoading(() => necesidadesStore.create(item), 'Guardando necesidad...')
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
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3">
          <BaseButton variant="ghost" @click="router.push(`/misiones/${missionId}`)"><ArrowLeft :size="18" /> Volver</BaseButton>
          <h1 class="text-2xl text-brand m-0">Levantamiento de Necesidades</h1>
        </div>
        <p v-if="mission" class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.municipio }}, {{ mission.estado }} - {{ mission.direccion }}</p>
      </div>
    </div>

    <BaseCard title="Registrar Necesidad">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <BaseInput v-model="formCategoria" label="Categoría" placeholder="Medicinas, Alimentos, Agua..." :error="formErrors.categoria" @update:model-value="formErrors.categoria = ''" />
        <BaseInput v-model="formDescripcion" label="Descripción" :error="formErrors.descripcion" @update:model-value="formErrors.descripcion = ''" />
        <BaseInput v-model="formCantidad" label="Cantidad Requerida" type="number" :error="formErrors.cantidad_requerida" @update:model-value="formErrors.cantidad_requerida = ''" />
        <BaseInput v-model="formUnidad" label="Unidad" placeholder="kg, unidades, litros..." />
        <BaseInput v-model="formObservaciones" label="Observaciones" />
        <BaseSelect
          v-model="formPrioridad"
          label="Prioridad"
          :error="formErrors.prioridad"
          :options="[
            { value: 'baja', label: 'Baja' },
            { value: 'media', label: 'Media' },
            { value: 'alta', label: 'Alta' },
            { value: 'critica', label: 'Crítica' },
          ]"
        />
      </div>
      <BaseButton variant="primary" @click="addNecesidad" :loading="saving"><Plus :size="18" /> Agregar Necesidad</BaseButton>
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