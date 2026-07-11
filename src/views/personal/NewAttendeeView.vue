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
import type { Atendido, InsumoLlevado } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()

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
  const n = parseInt(val) || 0
  if (n <= 0) {
    const { [id]: _, ...rest } = entregas.value
    entregas.value = rest
  } else {
    entregas.value = { ...entregas.value, [id]: n }
  }
}

async function registerAttendee() {
  if (!formCedula.value.trim() || !formNombre.value.trim()) {
    alert('Cédula y nombre del atendido son obligatorios.')
    return
  }
  const selectedIds = Object.keys(entregas.value)
  const insumosEntregados = selectedIds
    .map((id) => {
      const ins = insumosMision.value.find((i) => i.id === id)
      if (!ins) return null
      return { id: ins.id, descripcion: ins.descripcion, cantidad: entregas.value[id] }
    })
    .filter(Boolean)

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
    await insumosStore.update({ ...ins, estatus_cargamento: 'entregado', status_sync: 'pending' })
  }

  formCedula.value = ''
  formNombre.value = ''
  formTelefono.value = ''
  formNotas.value = ''
  entregas.value = {}
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
  <div class="new-attendee" v-if="mission">
    <div class="header-row">
      <div>
        <h1 class="page-title">Registrar Atención</h1>
        <p class="mission-info">{{ mission.municipio }}, {{ mission.estado }}</p>
      </div>
      <BaseButton variant="ghost" @click="router.push('/personal')"><ArrowLeft :size="18" /> Volver</BaseButton>
    </div>

    <BaseCard title="Datos de la Persona Atendida">
      <div class="form-grid">
        <BaseInput v-model="formCedula" label="Cédula del Atendido" required />
        <BaseInput v-model="formNombre" label="Nombre Completo" required />
        <BaseInput v-model="formTelefono" label="Teléfono de Contacto" />
        <BaseInput v-model="formNotas" label="Notas de la Atención" />
      </div>
    </BaseCard>

    <BaseCard title="Insumos a Entregar">
      <p class="hint" v-if="insumosMision.length === 0">
        No hay insumos disponibles en esta misión.
      </p>
      <div v-else class="insumo-list">
        <div
          v-for="ins in insumosMision"
          :key="ins.id"
          class="insumo-item"
          :class="{ selected: entregas[ins.id] }"
        >
          <input
            type="checkbox"
            :checked="!!entregas[ins.id]"
            @change="toggleInsumo(ins)"
          />
          <div class="insumo-info">
            <span class="insumo-desc">{{ ins.descripcion }}</span>
            <span class="insumo-meta">{{ ins.categoria }} — disp: {{ ins.cantidad }} {{ ins.unidad }}</span>
          </div>
          <div class="insumo-qty" v-if="entregas[ins.id]">
            <label>
              Cant:
              <input
                type="number"
                :value="entregas[ins.id]"
                min="1"
                :max="ins.cantidad"
                class="qty-input"
                @input="setCantidad(ins.id, ($event.target as HTMLInputElement).value)"
              />
              <span class="qty-unit">{{ ins.unidad }}</span>
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

    <div class="submit-row">
      <BaseButton variant="primary" size="lg" @click="registerAttendee">
        <UserPlus :size="20" /> Registrar Atención
      </BaseButton>
    </div>
  </div>
  <div v-else class="loading-state">
    <p>Cargando misión...</p>
    <BaseButton variant="ghost" @click="router.push('/personal')">Volver</BaseButton>
  </div>
</template>

<style scoped>
.new-attendee { display: flex; flex-direction: column; gap: 24px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.mission-info { color: #666; margin: 4px 0 0; font-size: 0.9rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.submit-row { display: flex; justify-content: flex-end; }
.hint { color: #666; font-style: italic; }

.insumo-list { display: flex; flex-direction: column; gap: 8px; }
.insumo-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  border: 2px solid #E3E3E3; border-radius: 8px;
  transition: all 0.2s;
}
.insumo-item.selected { border-color: #145CAD; background: rgba(20, 92, 173, 0.05); }
.insumo-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: #145CAD; }
.insumo-info { flex: 1; display: flex; flex-direction: column; }
.insumo-desc { font-weight: 600; font-size: 0.9rem; }
.insumo-meta { font-size: 0.75rem; color: #999; }
.insumo-qty label { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #333; }
.qty-input {
  width: 60px; padding: 4px 6px; border: 1px solid #BEBEBE; border-radius: 4px;
  font-family: inherit; font-size: 0.85rem; text-align: center;
}
.qty-input:focus { outline: none; border-color: #145CAD; }
.qty-unit { font-size: 0.75rem; color: #666; }

.loading-state { padding: 48px; text-align: center; color: #666; }
</style>
