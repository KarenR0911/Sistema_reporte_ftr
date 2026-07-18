<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import PersonalSelector from '@/components/ui/PersonalSelector.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ClipboardList, CheckCircle, ArrowLeft, Plus } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useTransporteStore } from '@/stores/transporte'
import { usePersonalStore } from '@/stores/personal'
import { useInsumosStore } from '@/stores/insumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useAuthStore } from '@/stores/auth'
import { useLoading } from '@/composables/useLoading'
import type { Mision, Transporte, PersonalMision, InsumoLlevado, Usuario } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, withLoading, saving } = useLoading()

const misionesStore = useMisionesStore()
const transporteStore = useTransporteStore()
const personalStore = usePersonalStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()

const storesReady = computed(() =>
  misionesStore.loaded && transporteStore.loaded && personalStore.loaded
  && insumosStore.loaded && (atendidosStore.loaded ?? true) && (necesidadesStore.loaded ?? true)
)

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))
const transportes = computed(() => transporteStore.getByMision(missionId))
const personales = computed(() => personalStore.getByMision(missionId))
const insumosMision = computed(() => insumosStore.getByMision(missionId))
const atendidos = computed(() => atendidosStore.getByMision(missionId))
const necesidades = computed(() => necesidadesStore.getByMision(missionId))

const role = computed(() => auth.userRole)
const canEdit = computed(() => role.value === 'director' || role.value === 'administrador' || role.value === 'coordinador')

const selectedUserList = ref<Usuario[]>([])

async function agregarPersonalSeleccionado() {
  await withLoading(async () => {
    const existentes = personalStore.getByMision(missionId)
    const cedulasExistentes = new Set(existentes.map((p) => p.cedula))
    const nuevos = selectedUserList.value.filter((p) => !cedulasExistentes.has(p.cedula))
    for (const p of nuevos) {
      const item: PersonalMision = {
        id: crypto.randomUUID(),
        id_mision: missionId,
        cedula: p.cedula,
        nombre: p.nombre,
        categoria_voluntariado: p.categoria_voluntariado ?? 'voluntario',
        especialidad: p.especialidad ?? '',
        area_voluntariado: p.area_voluntariado ?? '',
      }
      await personalStore.create(item)
    }
  }, 'Agregando personal...')
  selectedUserList.value = []
  showPersonalForm.value = false
}

const showTransportForm = ref(false)
const showPersonalForm = ref(false)
const transportForm = ref({ tipo_transporte: '', numero_placa: '', nombre_conductor: '' })

const showCompleteModal = ref(false)
const returnItems = ref<Record<string, boolean>>({})
const showRemovePersonalDialog = ref(false)
const personalToRemove = ref<string | null>(null)

function confirmRemovePersonal() {
  if (personalToRemove.value) {
    personalStore.remove(personalToRemove.value)
  }
  showRemovePersonalDialog.value = false
  personalToRemove.value = null
}

async function addTransporte() {
  await withLoading(async () => {
    const item: Transporte = {
      id: crypto.randomUUID(),
      id_mision: missionId,
      ...transportForm.value,
    }
    await transporteStore.create(item)
  }, 'Guardando transporte...')
  transportForm.value = { tipo_transporte: '', numero_placa: '', nombre_conductor: '' }
  showTransportForm.value = false
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
  await withLoading(async () => {
    for (const ins of insumosMision.value) {
      if (returnItems.value[ins.id]) {
        const updated = { ...ins, estatus_cargamento: 'retorno' as const }
        await insumosStore.update(updated)
      }
    }
    const updatedMission = { ...mission.value, estatus_mision: 'completada' as const }
    await misionesStore.update(updatedMission as Mision)
  }, 'Completando misión...')
  showCompleteModal.value = false
  router.push('/misiones')
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
  <div v-if="!storesReady" class="py-12 text-center text-text-secondary">
    <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
    <p>Cargando misión...</p>
  </div>
  <div v-else-if="mission" class="flex flex-col gap-6">
    <div class="flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3">
          <BaseButton variant="ghost" @click="router.push('/misiones')"><ArrowLeft :size="18" /> Volver</BaseButton>
          <h1 class="text-2xl text-brand m-0">{{ mission.municipio }}, {{ mission.estado }}</h1>
        </div>
        <p class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.direccion }}</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <StatusBadge :status="mission.estatus_mision" type="mision" />
        <RouterLink v-if="canEdit" :to="`/misiones/${missionId}/necesidades`">
          <BaseButton variant="primary"><ClipboardList :size="18" /> Levantar Necesidades</BaseButton>
        </RouterLink>
        <BaseButton v-if="canEdit && mission.estatus_mision === 'activa'" variant="secondary" @click="openCompleteModal">
          <CheckCircle :size="18" /> Completar Misión
        </BaseButton>
      </div>
    </div>

    <BaseCard title="Transporte">
      <template #default>
        <BaseButton v-if="canEdit" variant="primary" size="sm" @click="showTransportForm = !showTransportForm" class="mb-3">
          <Plus :size="16" /> Agregar Transporte
        </BaseButton>
        <div v-if="showTransportForm && canEdit" class="flex gap-2 items-end mb-3 flex-wrap">
          <BaseInput v-model="transportForm.tipo_transporte" placeholder="Tipo" />
          <BaseInput v-model="transportForm.numero_placa" placeholder="Placa" />
          <BaseInput v-model="transportForm.nombre_conductor" placeholder="Conductor" />
          <BaseButton variant="primary" size="sm" @click="addTransporte" :loading="saving">Guardar</BaseButton>
        </div>
        <BaseTable
          :columns="[
            { key: 'tipo_transporte', label: 'Tipo' },
            { key: 'numero_placa', label: 'Placa' },
            { key: 'nombre_conductor', label: 'Conductor' },
          ]"
          :rows="transportes as unknown as Record<string, unknown>[]"
        />
      </template>
    </BaseCard>

    <BaseCard title="Personal">
      <template #default>
        <BaseButton v-if="canEdit" variant="primary" size="sm" @click="showPersonalForm = !showPersonalForm" class="mb-3">
          <Plus :size="16" /> Agregar Personal
        </BaseButton>
        <div v-if="showPersonalForm && canEdit" class="bg-bg p-4 rounded-lg mb-4">
          <PersonalSelector v-model="selectedUserList" />
          <div class="flex gap-2 mt-3">
            <BaseButton variant="primary" size="sm" @click="agregarPersonalSeleccionado" :loading="saving">Agregar seleccionados</BaseButton>
            <BaseButton variant="ghost" size="sm" @click="showPersonalForm = false; selectedUserList = []">Cancelar</BaseButton>
          </div>
        </div>
        <BaseTable
          :columns="[
            { key: 'cedula', label: 'Cédula' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'categoria_voluntariado', label: 'Categoría' },
            { key: 'acciones', label: '' },
          ]"
          :rows="personales as unknown as Record<string, unknown>[]"
        >
          <template #cell-acciones="{ row }">
            <BaseButton
              v-if="canEdit"
              size="sm"
              variant="danger"
              @click="personalToRemove = (row as unknown as PersonalMision).id; showRemovePersonalDialog = true"
            >
              Quitar
            </BaseButton>
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
          { key: 'tipo_atencion', label: 'Tipo' },
          { key: 'edad', label: 'Edad' },
          { key: 'sexo', label: 'Sexo' },
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
      <div v-if="showCompleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000" @click.self="showCompleteModal = false">
        <div class="bg-white rounded-xl p-8 max-w-125 w-90% flex flex-col gap-4">
          <h2 class="m-0 text-brand">Completar Misión</h2>
          <p>Marca los insumos que retornan (no fueron entregados):</p>
          <div v-for="ins in insumosMision" :key="ins.id">
            <label class="flex items-center gap-2.5 cursor-pointer py-1.5">
              <input type="checkbox" v-model="returnItems[ins.id]" class="accent-primary w-4.5 h-4.5" />
              <span>{{ ins.categoria }} — {{ ins.descripcion }} ({{ ins.cantidad }} {{ ins.unidad }})</span>
            </label>
          </div>
          <p v-if="insumosMision.length === 0" class="text-text-secondary italic">No hay insumos registrados.</p>
          <div class="flex gap-2 justify-end mt-2">
            <BaseButton variant="primary" @click="confirmComplete" :loading="saving">Confirmar y Completar</BaseButton>
            <BaseButton variant="ghost" @click="showCompleteModal = false">Cancelar</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :show="showRemovePersonalDialog"
      title="Quitar personal"
      message="¿Estás seguro de quitar a este miembro de la misión?"
      description="El registro se eliminará de forma permanente. Podrás volver a agregarlo si es necesario."
      confirm-text="Quitar"
      variant="danger"
      @confirm="confirmRemovePersonal"
      @cancel="showRemovePersonalDialog = false; personalToRemove = null"
    />
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <p>Misión no encontrada.</p>
    <BaseButton variant="ghost" @click="router.push('/misiones')">Volver a misiones</BaseButton>
  </div>
</template>