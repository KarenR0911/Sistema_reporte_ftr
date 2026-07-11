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
import { useTransporteStore } from '@/stores/transporte'
import { usePersonalStore } from '@/stores/personal'
import { useInsumosStore } from '@/stores/insumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import type { Mision, Transporte, PersonalMision, InsumoLlevado } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const transporteStore = useTransporteStore()
const personalStore = usePersonalStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))
const transportes = computed(() => transporteStore.getByMision(missionId))
const personales = computed(() => personalStore.getByMision(missionId))
const insumosMision = computed(() => insumosStore.getByMision(missionId))
const atendidos = computed(() => atendidosStore.getByMision(missionId))
const necesidades = computed(() => necesidadesStore.getByMision(missionId))

const showTransportForm = ref(false)
const showPersonalForm = ref(false)
const transportForm = ref({ tipo_transporte: '', numero_placa: '', nombre_conductor: '' })
const personalForm = ref({ cedula: '', nombre: '', categoria_voluntariado: '', especialidad: '' })

const showCompleteModal = ref(false)
const returnItems = ref<Record<string, boolean>>({})

async function addTransporte() {
  const item: Transporte = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    ...transportForm.value,
    status_sync: 'pending',
  }
  await transporteStore.create(item)
  transportForm.value = { tipo_transporte: '', numero_placa: '', nombre_conductor: '' }
  showTransportForm.value = false
}

async function addPersonal() {
  const item: PersonalMision = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    ...personalForm.value,
    categoria_voluntariado: personalForm.value.categoria_voluntariado as PersonalMision['categoria_voluntariado'],
    status_sync: 'pending',
  }
  await personalStore.create(item)
  personalForm.value = { cedula: '', nombre: '', categoria_voluntariado: '', especialidad: '' }
  showPersonalForm.value = false
}

function openCompleteModal() {
  const r: Record<string, boolean> = {}
  for (const ins of insumosMision.value) {
    r[ins.id] = false
  }
  returnItems.value = r
  showCompleteModal.value = true
}

async function confirmComplete() {
  if (!mission.value) return
  for (const ins of insumosMision.value) {
    if (returnItems.value[ins.id]) {
      const updated = { ...ins, estatus_cargamento: 'retorno' as const, status_sync: 'pending' as const }
      await insumosStore.update(updated)
    }
  }
  const updatedMission = { ...mission.value, estatus_mision: 'completada' as const, status_sync: 'pending' as const }
  await misionesStore.update(updatedMission as Mision)
  showCompleteModal.value = false
  router.push('/coordinador')
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    transporteStore.load(),
    personalStore.load(),
    insumosStore.load(),
    atendidosStore.load(),
    necesidadesStore.load(),
  ])
})
</script>

<template>
  <div class="mission-detail" v-if="mission">
    <div class="header-row">
      <div>
        <h1 class="page-title">{{ mission.municipio }}, {{ mission.estado }}</h1>
        <p class="mission-dir">{{ mission.direccion }}</p>
      </div>
      <div class="header-actions">
        <StatusBadge :status="mission.estatus_mision" type="mision" />
        <RouterLink :to="`/coordinador/necesidades/${missionId}`">
          <BaseButton variant="primary">Levantar Necesidades</BaseButton>
        </RouterLink>
        <BaseButton v-if="mission.estatus_mision === 'activa'" variant="secondary" @click="openCompleteModal">
          Completar Misión
        </BaseButton>
        <BaseButton variant="ghost" @click="router.push('/coordinador')">Volver</BaseButton>
      </div>
    </div>

    <BaseCard title="Transporte">
      <template #default>
        <BaseButton variant="primary" size="sm" @click="showTransportForm = !showTransportForm" class="mb">
          + Agregar Transporte
        </BaseButton>
        <div v-if="showTransportForm" class="inline-form">
          <BaseInput v-model="transportForm.tipo_transporte" placeholder="Tipo" />
          <BaseInput v-model="transportForm.numero_placa" placeholder="Placa" />
          <BaseInput v-model="transportForm.nombre_conductor" placeholder="Conductor" />
          <BaseButton variant="primary" size="sm" @click="addTransporte">Guardar</BaseButton>
        </div>
        <BaseTable
          :columns="[
            { key: 'tipo_transporte', label: 'Tipo' },
            { key: 'numero_placa', label: 'Placa' },
            { key: 'nombre_conductor', label: 'Conductor' },
            { key: 'status_sync', label: 'Sync' },
          ]"
          :rows="transportes as unknown as Record<string, unknown>[]"
        >
          <template #cell-status_sync="{ value }">
            <StatusBadge :status="value as string" type="sync" />
          </template>
        </BaseTable>
      </template>
    </BaseCard>

    <BaseCard title="Personal">
      <template #default>
        <BaseButton variant="primary" size="sm" @click="showPersonalForm = !showPersonalForm" class="mb">
          + Agregar Personal
        </BaseButton>
        <div v-if="showPersonalForm" class="inline-form">
          <BaseInput v-model="personalForm.cedula" placeholder="Cédula" />
          <BaseInput v-model="personalForm.nombre" placeholder="Nombre" />
          <BaseSelect
            v-model="personalForm.categoria_voluntariado"
            :options="[
              { value: 'estudiante', label: 'Estudiante' },
              { value: 'profesional', label: 'Profesional' },
              { value: 'voluntario', label: 'Voluntario' },
            ]"
          />
          <BaseInput v-model="personalForm.especialidad" placeholder="Especialidad" />
          <BaseButton variant="primary" size="sm" @click="addPersonal">Guardar</BaseButton>
        </div>
        <BaseTable
          :columns="[
            { key: 'cedula', label: 'Cédula' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'categoria_voluntariado', label: 'Categoría' },
            { key: 'status_sync', label: 'Sync' },
          ]"
          :rows="personales as unknown as Record<string, unknown>[]"
        >
          <template #cell-status_sync="{ value }">
            <StatusBadge :status="value as string" type="sync" />
          </template>
        </BaseTable>
      </template>
    </BaseCard>

    <BaseCard title="Insumos Llevados">
      <BaseTable
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'cantidad', label: 'Cant.' },
          { key: 'unidad', label: 'Unidad' },
          { key: 'estatus_cargamento', label: 'Estatus' },
        ]"
        :rows="insumosMision as unknown as Record<string, unknown>[]"
      >
        <template #cell-estatus_cargamento="{ value }">
          <StatusBadge :status="value as string" type="cargamento" />
        </template>
      </BaseTable>
    </BaseCard>

    <BaseCard title="Atendidos">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Nombre' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
        ]"
        :rows="atendidos as unknown as Record<string, unknown>[]"
      />
    </BaseCard>

    <BaseCard title="Necesidades">
      <BaseTable
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'cantidad_requerida', label: 'Cant.' },
          { key: 'prioridad', label: 'Prioridad' },
          { key: 'estatus', label: 'Estatus' },
        ]"
        :rows="necesidades as unknown as Record<string, unknown>[]"
      >
        <template #cell-prioridad="{ value }">
          <StatusBadge :status="value as string" />
        </template>
        <template #cell-estatus="{ value }">
          <StatusBadge :status="value as string" type="necesidad" />
        </template>
      </BaseTable>
    </BaseCard>

    <Teleport to="body">
      <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
        <div class="modal-content">
          <h2>Completar Misión</h2>
          <p>Marca los insumos que retornan (no fueron entregados):</p>
          <div v-for="ins in insumosMision" :key="ins.id" class="return-item">
            <label>
              <input type="checkbox" v-model="returnItems[ins.id]" />
              <span>{{ ins.categoria }} — {{ ins.descripcion }} ({{ ins.cantidad }} {{ ins.unidad }})</span>
            </label>
          </div>
          <p v-if="insumosMision.length === 0" class="empty-return">No hay insumos registrados.</p>
          <div class="modal-actions">
            <BaseButton variant="primary" @click="confirmComplete">Confirmar y Completar</BaseButton>
            <BaseButton variant="ghost" @click="showCompleteModal = false">Cancelar</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mission-detail { display: flex; flex-direction: column; gap: 24px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.mission-dir { color: #666; margin: 4px 0 0; font-size: 0.9rem; }
.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.inline-form { display: flex; gap: 8px; align-items: end; margin-bottom: 12px; flex-wrap: wrap; }
.mb { margin-bottom: 12px; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: #fff; border-radius: 12px; padding: 32px; max-width: 500px; width: 90%;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-content h2 { margin: 0; color: #00244D; }
.return-item label { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 0; }
.return-item input { accent-color: #145CAD; width: 18px; height: 18px; }
.empty-return { color: #666; font-style: italic; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
</style>
