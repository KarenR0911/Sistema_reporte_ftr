<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { UserPlus, ArrowLeft } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useInsumosStore } from '@/stores/insumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { Atendido, InsumoLlevado } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()
const toast = useToastStore()

const missionId = route.params.id_mision as string
const mission = computed(() => misionesStore.getById(missionId))
const insumosMision = computed(() =>
  insumosStore.getByMision(missionId).filter((i) => i.estatus_cargamento !== 'retorno'),
)

const formCedula = ref('')
const formNombre = ref('')
const formTelefono = ref('')
const formNotas = ref('')
const entregas = ref<Record<string, number>>({})

function toggleInsumo(ins: InsumoLlevado) {
  if (entregas.value[ins.id]) {
    const { [ins.id]: _, ...rest } = entregas.value
    entregas.value = rest
  } else {
    entregas.value = { ...entregas.value, [ins.id]: 1 }
  }
}

function setCantidad(id: string, val: string) {
  const n = parseInt(val, 10) || 0
  if (n <= 0) {
    const { [id]: _, ...rest } = entregas.value
    entregas.value = rest
  } else {
    entregas.value = { ...entregas.value, [id]: n }
  }
}

async function registerAttendee() {
  if (!formCedula.value.trim() || !formNombre.value.trim()) {
    toast.error('Cédula y nombre del atendido son obligatorios.')
    return
  }
  const selectedIds = Object.keys(entregas.value)
  const insumosEntregados = selectedIds
    .map((id) => {
      const ins = insumosMision.value.find((i) => i.id === id)
      if (!ins) return null
      return { id: ins.id, descripcion: ins.descripcion, cantidad: entregas.value[id]! }
    })
    .filter((v): v is NonNullable<typeof v> => v != null)

  const item: Atendido = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    cedula_personal: auth.currentUser?.cedula ?? '',
    cedula_atendido: formCedula.value,
    nombre_atendido: formNombre.value,
    telefono_contacto: formTelefono.value,
    fecha_hora_atencion: new Date().toISOString(),
    notas: formNotas.value,
    insumos_dados: JSON.stringify(insumosEntregados),
    status_sync: 'pending',
  }
  await atendidosStore.create(item)

  for (const entrega of insumosEntregados) {
    if (!entrega) continue
    const ins = insumosMision.value.find((i) => i.id === entrega.id)
    if (!ins) continue
    const nuevaCantidad = Math.max(0, ins.cantidad - entrega.cantidad)
    await insumosStore.update({ ...ins, cantidad: nuevaCantidad, status_sync: 'pending' })
  }

  formCedula.value = ''
  formNombre.value = ''
  formTelefono.value = ''
  formNotas.value = ''
  entregas.value = {}
  toast.success('Atención registrada exitosamente')
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    insumosStore.load(),
    atendidosStore.load(),
  ])
})
</script>

<template>
  <div v-if="mission" class="flex flex-col gap-6">
    <div class="flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3">
          <BaseButton variant="ghost" @click="router.push('/dashboard')"><ArrowLeft :size="18" /> Volver</BaseButton>
          <h1 class="text-2xl text-brand m-0">Registrar Atención</h1>
        </div>
        <p class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.municipio }}, {{ mission.estado }}</p>
      </div>
    </div>

    <BaseCard title="Datos de la Persona Atendida">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <BaseInput v-model="formCedula" label="Cédula del Atendido" required />
        <BaseInput v-model="formNombre" label="Nombre Completo" required />
        <BaseInput v-model="formTelefono" label="Teléfono de Contacto" />
        <BaseInput v-model="formNotas" label="Notas de la Atención" />
      </div>
    </BaseCard>

    <BaseCard title="Insumos a Entregar">
      <p v-if="insumosMision.length === 0" class="text-text-secondary italic">
        No hay insumos disponibles en esta misión.
      </p>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="ins in insumosMision"
          :key="ins.id"
          class="flex items-center gap-3 px-3.5 py-2.5 border-2 rounded-lg transition-all"
          :class="entregas[ins.id] ? 'border-primary bg-primary/5' : 'border-border-light'"
        >
          <input
            type="checkbox"
            :checked="!!entregas[ins.id]"
            @change="toggleInsumo(ins)"
            class="w-4.5 h-4.5 accent-primary"
          />
          <div class="flex-1 flex flex-col">
            <span class="font-semibold text-[0.9rem]">{{ ins.descripcion }}</span>
            <span class="text-xs text-text-muted">{{ ins.categoria }} — disp: {{ ins.cantidad }} {{ ins.unidad }}</span>
          </div>
          <div v-if="entregas[ins.id]">
            <label class="flex items-center gap-1 text-sm text-text">
              Cant:
              <input
                type="number"
                :value="entregas[ins.id]"
                min="1"
                :max="ins.cantidad"
                class="w-15 px-1.5 py-1 border border-border rounded-md text-sm text-center font-sans focus:outline-none focus:border-primary"
                @input="setCantidad(ins.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="text-xs text-text-secondary">{{ ins.unidad }}</span>
            </label>
          </div>
          <StatusBadge :status="ins.estatus_cargamento" type="cargamento" />
        </div>
      </div>
    </BaseCard>

    <BaseCard title="Atenciones Registradas en esta Misión">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Nombre' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
          { key: 'status_sync', label: 'Sync' },
        ]"
        :rows="atendidosStore.getByMision(missionId) as unknown as Record<string, unknown>[]"
      >
        <template #cell-status_sync="{ value }">
          <StatusBadge :status="value as string" type="sync" />
        </template>
      </BaseTable>
    </BaseCard>

    <div class="flex justify-end">
      <BaseButton variant="primary" size="lg" @click="registerAttendee">
        <UserPlus :size="20" /> Registrar Atención
      </BaseButton>
    </div>
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <p>Cargando misión...</p>
    <BaseButton variant="ghost" @click="router.push('/dashboard')">Volver</BaseButton>
  </div>
</template>
