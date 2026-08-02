<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import PersonalSelector from '@/components/ui/PersonalSelector.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ClipboardList, CheckCircle, ArrowLeft, Plus, Package, Eye, ChevronDown, FileText } from '@lucide/vue'
import MisionCharts from '@/components/charts/MisionCharts.vue'
import MisionReport from '@/components/reports/MisionReport.vue'
import PlanMision from '@/components/reports/PlanMision.vue'
import FichaAtencion from '@/components/reports/FichaAtencion.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useTransporteStore } from '@/stores/transporte'
import { usePersonalStore } from '@/stores/personal'
import { useInsumosStore } from '@/stores/insumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'
import { useSalidasInsumosStore } from '@/stores/salidasInsumos'
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useToastStore } from '@/stores/toast'
import { useLoading } from '@/composables/useLoading'
import { insumoSchema } from '@/lib/schemas'
import { INSUMO_CATEGORIAS } from '@/types'
import type { Mision, Transporte, PersonalMision, InsumoLlevado, Usuario, Atendido, SalidaInsumo } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const { isOnline } = useOnlineStatus()
const { withLoading, saving } = useLoading()

const misionesStore = useMisionesStore()
const transporteStore = useTransporteStore()
const personalStore = usePersonalStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()
const salidasStore = useSalidasInsumosStore()

const storesReady = computed(() =>
  misionesStore.loaded && transporteStore.loaded && personalStore.loaded
  && insumosStore.loaded && atendidosStore.loaded && necesidadesStore.loaded && salidasStore.loaded
)

const canManageInsumos = computed(() =>
  role.value === 'director' || role.value === 'administrador',
)

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))
const transportes = computed(() => transporteStore.getByMision(missionId))
const personales = computed(() => personalStore.getByMision(missionId))
const insumosMision = computed(() => insumosStore.getByMision(missionId))
const atendidos = computed(() => atendidosStore.getByMision(missionId))
const necesidades = computed(() => necesidadesStore.getByMision(missionId))
const salidasMision = computed(() => salidasStore.getByMision(missionId))

const role = computed(() => auth.userRole)
const canEdit = computed(() => role.value === 'director' || role.value === 'administrador' || role.value === 'coordinador')
const canFinalize = computed(() => role.value === 'director' || role.value === 'administrador')

const showDetail = ref(false)
const selectedAtendido = ref<Atendido | null>(null)
const showCharts = ref(false)

function openDetail(a: Atendido) {
  selectedAtendido.value = a
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedAtendido.value = null
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function labelTipoAtencion(val: unknown): string {
  return val === 'medica' ? 'Médica / Primeros Auxilios'
    : val === 'psicosocial' ? 'Apoyo Psicosocial'
    : val === 'alimento' ? 'Alimentación / Hidratación'
    : val === 'refugio' ? 'Refugio / Abrigo'
    : val === 'higiene' ? 'Kits de Higiene'
    : val === 'informacion' ? 'Orientación'
    : val === 'traslado' ? 'Traslado / Evacuación'
    : val === 'otro' ? 'Otro' : '—'
}

function labelSexo(val: unknown): string {
  return val === 'masculino' ? 'Masculino'
    : val === 'femenino' ? 'Femenino'
    : val === 'otro' ? 'Otro' : '—'
}

  function labelVuln(v: string): string {
  return v === 'embarazada' ? 'Embarazada'
    : v === 'discapacidad' ? 'Discapacidad'
    : v === 'adulto_mayor' ? 'Adulto Mayor'
    : v === 'menor_no_acompanado' ? 'Menor solo'
    : v === 'enfermedad_cronica' ? 'Enf. Crónica'
    : v === 'otro' ? 'Otra' : v
}

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
  showCompleteModal.value = true
}

async function confirmComplete() {
  if (!mission.value) return
  if (!navigator.onLine) {
    toast.error('Necesitas conexión a internet para completar la misión')
    return
  }
  await withLoading(async () => {
    const updatedMission = { ...mission.value, estatus_mision: 'completada' as const }
    await misionesStore.update(updatedMission as Mision)
  }, 'Completando misión...')
  showCompleteModal.value = false
  router.push('/misiones')
}

const printing = ref<'none' | 'report' | 'plan'>('none')
const showAddInsumoForm = ref(false)
const fichaAtendido = ref<Atendido | null>(null)
const printFicha = ref(false)
const newInsumo = ref({ categoria: '', descripcion: '', cantidad: '' as string | number, unidad: '', observaciones: '' })
const insumoFormErrors = ref<Record<string, string>>({})

async function addInsumoToMission() {
  insumoFormErrors.value = {}
  const cantidad = Number(newInsumo.value.cantidad) || 0
  const result = insumoSchema.safeParse({ ...newInsumo.value, cantidad })
  if (!result.success) {
    for (const issue of result.error.issues) {
      insumoFormErrors.value[issue.path[0] as string] = issue.message
    }
    toast.error('Completa correctamente los datos del insumo.')
    return
  }
  const item: InsumoLlevado = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    categoria: newInsumo.value.categoria,
    descripcion: newInsumo.value.descripcion,
    cantidad,
    unidad: newInsumo.value.unidad,
    observaciones: newInsumo.value.observaciones,
  }
  await withLoading(() => insumosStore.create(item), 'Agregando insumo...')
  newInsumo.value = { categoria: '', descripcion: '', cantidad: '', unidad: '', observaciones: '' }
  insumoFormErrors.value = {}
  showAddInsumoForm.value = false
  toast.success('Insumo agregado a la misión')
}

async function printReport() {
  printing.value = 'report'
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))
  window.print()
}

async function printPlan() {
  printing.value = 'plan'
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))
  window.print()
}

function showFicha(a: Atendido) {
  fichaAtendido.value = a
  printFicha.value = true
  nextTick().then(() => {
    setTimeout(() => window.print(), 300)
  })
}

function onAfterPrint() {
  printing.value = 'none'
  printFicha.value = false
  fichaAtendido.value = null
}

onMounted(async () => {
  window.addEventListener('afterprint', onAfterPrint)
  await Promise.all([
    misionesStore.load(),
    transporteStore.load(),
    personalStore.load(),
    insumosStore.load(),
    atendidosStore.load(),
    necesidadesStore.load(),
    salidasStore.load(),
  ])
})

onUnmounted(() => {
  window.removeEventListener('afterprint', onAfterPrint)
})
</script>

<template>
  <div>
    <div v-if="!storesReady" class="py-12 text-center text-text-secondary">
      <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>Cargando misión...</p>
    </div>
    <div v-else-if="mission" class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-3">
      <div>
        <div class="flex items-center gap-3">
          <BaseButton variant="ghost" @click="router.push('/misiones')"><ArrowLeft :size="18" /> Volver</BaseButton>
          <h1 class="text-xl md:text-2xl text-brand m-0">{{ mission.municipio }}, {{ mission.estado }}</h1>
        </div>
        <p class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.direccion }}</p>
      </div>
      <div class="flex items-center gap-2 md:gap-3 flex-wrap">
        <StatusBadge :status="mission.estatus_mision" />
        <RouterLink v-if="canEdit" :to="`/misiones/${missionId}/necesidades`">
          <BaseButton variant="primary"><ClipboardList :size="18" /> Levantar Necesidades</BaseButton>
        </RouterLink>
        <RouterLink v-if="canManageInsumos" :to="`/misiones/${missionId}/dispensacion`">
          <BaseButton variant="primary"><Package :size="18" /> Dispensación</BaseButton>
        </RouterLink>
        <BaseButton v-if="canFinalize" variant="ghost" @click="printReport">
          <FileText :size="18" /> Reporte
        </BaseButton>
        <BaseButton v-if="canFinalize" variant="ghost" @click="printPlan">
          <ClipboardList :size="18" /> Plan
        </BaseButton>
        <BaseButton v-if="canFinalize && mission.estatus_mision === 'activa'" variant="secondary" @click="openCompleteModal" :disabled="!isOnline">
          <CheckCircle :size="18" /> {{ isOnline ? 'Completar Misión' : 'Requiere conexión' }}
        </BaseButton>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light">
      <button
        class="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-surface/50 transition-colors border-0 bg-transparent"
        @click="showCharts = !showCharts"
      >
        <h3 class="m-0 text-lg text-brand font-bold">Estadísticas</h3>
        <ChevronDown
          :size="20"
          class="text-text-secondary transition-transform duration-200"
          :class="{ 'rotate-180': showCharts }"
        />
      </button>
      <div
        v-show="showCharts"
        class="px-6 pb-6 border-t border-border-light pt-4"
      >
        <MisionCharts
          :atendidos="atendidos"
          :insumos="insumosMision"
          :salidas="salidasMision"
          :necesidades="necesidades"
          :personales="personales"
        />
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
            { key: 'especialidad', label: 'Especialidad' },
            { key: 'area_voluntariado', label: 'Área' },
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
      <BaseButton
        v-if="canManageInsumos"
        variant="secondary"
        size="sm"
        class="mb-3"
        @click="showAddInsumoForm = !showAddInsumoForm"
      >
        <Plus :size="16" /> Agregar Insumo
      </BaseButton>
      <div v-if="showAddInsumoForm && canManageInsumos" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-bg rounded-lg">
        <BaseSelect
          v-model="newInsumo.categoria"
          label="Categoría"
          required
          :options="INSUMO_CATEGORIAS.map(c => ({ value: c, label: c }))"
          :error="insumoFormErrors.categoria"
        />
        <BaseInput v-model="newInsumo.descripcion" label="Descripción" :error="insumoFormErrors.descripcion" />
        <BaseInput v-model="newInsumo.cantidad" label="Cantidad" type="number" :error="insumoFormErrors.cantidad" />
        <BaseInput v-model="newInsumo.unidad" label="Unidad" placeholder="kg, unidades, litros..." :error="insumoFormErrors.unidad" />
        <div class="col-span-2">
          <BaseInput v-model="newInsumo.observaciones" label="Observaciones" />
        </div>
        <div class="col-span-2 flex gap-2 justify-end">
          <BaseButton variant="primary" size="sm" @click="addInsumoToMission" :loading="saving">Guardar Insumo</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="showAddInsumoForm = false; insumoFormErrors = {}">Cancelar</BaseButton>
        </div>
      </div>
      <BaseTable
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'cantidad', label: 'Cant.' },
          { key: 'unidad', label: 'Unidad' },
        ]"
        :rows="insumosMision as unknown as Record<string, unknown>[]"
      />
    </BaseCard>

    <BaseCard title="Atendidos / Registros">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Nombre' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'edad', label: 'Edad' },
          { key: 'sexo', label: 'Sexo' },
          { key: 'area_registro', label: 'Área' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
          { key: 'acciones', label: '' },
        ]"
        :rows="atendidos as unknown as Record<string, unknown>[]"
      >
        <template #cell-sexo="{ value }">
          {{ labelSexo(value) }}
        </template>
        <template #cell-area_registro="{ value }">
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{{ value || 'general' }}</span>
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex gap-1">
            <BaseButton size="sm" variant="ghost" @click="openDetail(row as unknown as Atendido)">
              <Eye :size="16" />
            </BaseButton>
            <BaseButton size="sm" variant="ghost" @click="showFicha(row as unknown as Atendido)">
              <FileText :size="16" />
            </BaseButton>
          </div>
        </template>
      </BaseTable>
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
          <StatusBadge :status="value as string" />
        </template>
      </BaseTable>
    </BaseCard>

    <Teleport to="body">
      <div v-if="showCompleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000" @click.self="showCompleteModal = false">
        <div class="bg-white rounded-xl p-8 max-w-125 w-90% flex flex-col gap-4">
          <h2 class="m-0 text-brand">Completar Misión</h2>
          <p>¿Estás seguro de completar esta misión?</p>
          <p class="text-text-secondary text-sm">La misión se marcará como completada y no podrá recibir más modificaciones.</p>
          <div class="flex gap-2 justify-end mt-2">
            <BaseButton variant="primary" @click="confirmComplete" :loading="saving">Confirmar y Completar</BaseButton>
            <BaseButton variant="ghost" @click="showCompleteModal = false">Cancelar</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showDetail && selectedAtendido"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000"
        @click.self="closeDetail"
      >
        <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-brand text-lg font-bold">Detalle del Registro</h3>
            <BaseButton variant="ghost" size="sm" @click="closeDetail">✕</BaseButton>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div class="col-span-2">
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Área</span>
              <span class="capitalize">{{ selectedAtendido.area_registro || 'General' }}</span>
            </div>
            <div class="col-span-2">
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Nombre</span>
              <span>{{ selectedAtendido.nombre_atendido }}</span>
            </div>
            <template v-if="selectedAtendido.area_registro !== 'veterinaria'">
              <div>
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Cédula</span>
                <span>{{ selectedAtendido.cedula_atendido || '—' }}</span>
              </div>
            </template>
            <template v-if="selectedAtendido.area_registro === 'veterinaria'">
              <div>
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Especie</span>
                <span>{{ selectedAtendido.especie || '—' }}</span>
              </div>
              <div>
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Posee tutor</span>
                <span>{{ selectedAtendido.posee_tutor ? 'Sí' : 'No' }}</span>
              </div>
              <div>
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Rescatado</span>
                <span>{{ selectedAtendido.rescatado ? 'Sí' : 'No' }}</span>
              </div>
              <div>
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">En adopción</span>
                <span>{{ selectedAtendido.en_adopcion ? 'Sí' : 'No' }}</span>
              </div>
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Diagnóstico</span>
                <span>{{ selectedAtendido.diagnostico_tentativo || '—' }}</span>
              </div>
            </template>
            <div v-if="selectedAtendido.area_registro !== 'veterinaria'">
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Teléfono</span>
              <span>{{ selectedAtendido.telefono_contacto || '—' }}</span>
            </div>
            <div>
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Edad</span>
              <span>{{ selectedAtendido.edad ?? '—' }}</span>
            </div>
            <div>
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Sexo</span>
              <span>{{ labelSexo(selectedAtendido.sexo) }}</span>
            </div>
            <template v-if="selectedAtendido.area_registro === 'medicina_humana' || selectedAtendido.area_registro === 'psicologia' || selectedAtendido.area_registro === 'logistica'">
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Lugar donde vivía</span>
                <span>{{ selectedAtendido.lugar_vivia || '—' }}</span>
              </div>
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Lugar actual</span>
                <span>{{ selectedAtendido.lugar_actual || '—' }}</span>
              </div>
            </template>
            <template v-if="selectedAtendido.area_registro === 'medicina_humana' || selectedAtendido.area_registro === 'psicologia'">
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Motivo de Atención</span>
                <span>{{ selectedAtendido.motivo_atencion || '—' }}</span>
              </div>
            </template>
            <template v-if="selectedAtendido.area_registro === 'logistica'">
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Insumo Entregado</span>
                <span>{{ selectedAtendido.insumo_entregado || '—' }}</span>
              </div>
            </template>
            <template v-if="selectedAtendido.area_registro === 'general'">
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Tipo de Atención</span>
                <span>{{ labelTipoAtencion(selectedAtendido.tipo_atencion) }}</span>
              </div>
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Requiere Referencia</span>
                <span>{{ selectedAtendido.referido ? 'Sí' : 'No' }}</span>
              </div>
              <div class="col-span-2">
                <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Vulnerabilidades</span>
                <div v-if="selectedAtendido.vulnerabilidad" class="flex flex-wrap gap-1 mt-1">
                  <span v-for="v in (selectedAtendido.vulnerabilidad ?? [])" :key="v" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{{ labelVuln(v) }}</span>
                </div>
                <span v-else class="text-text-secondary">—</span>
              </div>
            </template>
            <div class="col-span-2">
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Notas</span>
              <p class="m-0 whitespace-pre-wrap">{{ selectedAtendido.notas || '—' }}</p>
            </div>
            <div class="col-span-2 pt-2 border-t border-border">
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Registrado por</span>
              <span>{{ selectedAtendido.cedula_personal }}</span>
            </div>
            <div>
              <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide">Fecha</span>
              <span>{{ formatDate(selectedAtendido.fecha_hora_atencion) }}</span>
            </div>
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

    <Teleport to="body">
      <div v-if="printing !== 'none'" class="printing-overlay">
        <div class="no-print flex items-center justify-center min-h-screen bg-white">
          <div class="text-center py-20">
            <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p class="text-text-secondary">Preparando reporte para impresión...</p>
          </div>
        </div>
        <MisionReport
          v-if="printing === 'report'"
          :mission="mission!"
          :atendidos="atendidos"
          :insumos="insumosMision"
          :necesidades="necesidades"
          :personales="personales"
          :salidas="salidasMision"
          :transportes="transportes"
        />
        <PlanMision
          v-if="printing === 'plan'"
          :mission="mission!"
          :transportes="transportes"
          :personales="personales"
          :insumos="insumosMision"
        />
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="printFicha && fichaAtendido" class="printing-overlay">
        <div class="no-print flex items-center justify-center min-h-screen bg-white">
          <div class="text-center py-20">
            <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p class="text-text-secondary">Preparando ficha para impresión...</p>
          </div>
        </div>
        <FichaAtencion
          :atendido="fichaAtendido"
          :mission="mission!"
          :personal="personales.find(p => p.cedula === fichaAtendido!.cedula_personal) ?? null"
        />
      </div>
    </Teleport>
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <p>Misión no encontrada.</p>
    <BaseButton variant="ghost" @click="router.push('/misiones')">Volver a misiones</BaseButton>
  </div>
  </div>
</template>

<style scoped>
.printing-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: white;
  overflow: auto;
}

@media print {
  .printing-overlay {
    position: static !important;
    overflow: visible !important;
    background: white !important;
  }
}
</style>