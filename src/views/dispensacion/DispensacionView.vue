<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { ArrowLeft, Package, Plus, Trash2 } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useInsumosStore } from '@/stores/insumos'
import { useSalidasInsumosStore } from '@/stores/salidasInsumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useLoading } from '@/composables/useLoading'
import { salidaInsumoSchema } from '@/lib/schemas'
import type { InsumoLlevado, SalidaInsumo, Atendido } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const insumosStore = useInsumosStore()
const salidasStore = useSalidasInsumosStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()
const toast = useToastStore()
const { withLoading, saving } = useLoading()

const missionId = route.params.id as string
const mission = computed(() => misionesStore.getById(missionId))

const insumosMision = computed(() => insumosStore.getByMision(missionId))
const salidasMision = computed(() => salidasStore.getByMision(missionId))

const totalSalidasPorInsumo = computed(() => {
  const map = new Map<string, number>()
  for (const s of salidasMision.value) {
    map.set(s.id_insumo, (map.get(s.id_insumo) ?? 0) + s.cantidad)
  }
  return map
})

function stockDisponible(ins: InsumoLlevado): number {
  return ins.cantidad - (totalSalidasPorInsumo.value.get(ins.id) ?? 0)
}

const insumoOptions = computed(() =>
  insumosMision.value
    .filter((i) => stockDisponible(i) > 0)
    .map((i) => ({
      value: i.id,
      label: `${i.descripcion} (${i.categoria}) — disp: ${stockDisponible(i)} ${i.unidad}`,
    })),
)

const showForm = ref(false)
const formIdInsumo = ref('')
const formCantidad = ref<number | null>(null)
const formMotivo = ref('')
const formCedula = ref('')
const formNombre = ref('')
const formEdad = ref<number | null>(null)
const formSexo = ref('')
const formLugarVivia = ref('')
const formLugarActual = ref('')
const formErrors = ref<Record<string, string>>({})

const showDeleteDialog = ref(false)
const salidaToDelete = ref<SalidaInsumo | null>(null)

const sexoOptions = [
  { value: '', label: 'Seleccionar…' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

function resetForm() {
  formIdInsumo.value = ''
  formCantidad.value = null
  formMotivo.value = ''
  formCedula.value = ''
  formNombre.value = ''
  formEdad.value = null
  formSexo.value = ''
  formLugarVivia.value = ''
  formLugarActual.value = ''
  formErrors.value = {}
  showForm.value = false
}

const insumoSeleccionado = computed(() =>
  insumosMision.value.find((i) => i.id === formIdInsumo.value),
)

async function registrarEntrega() {
  formErrors.value = {}

  const result = salidaInsumoSchema.safeParse({
    id_insumo: formIdInsumo.value,
    cantidad: formCantidad.value,
    motivo: formMotivo.value,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }

  if (!formCedula.value.trim() || !formNombre.value.trim()) {
    formErrors.value.cedula = formCedula.value.trim() ? '' : 'Cédula del beneficiario es requerida'
    formErrors.value.nombre = formNombre.value.trim() ? '' : 'Nombre del beneficiario es requerido'
    return
  }

  const ins = insumoSeleccionado.value
  if (!ins) return
  const disp = stockDisponible(ins)
  if (formCantidad.value! > disp) {
    formErrors.value.cantidad = `Solo hay ${disp} ${ins.unidad} disponible(s)`
    return
  }

  const now = new Date().toISOString()

  const salidaItem: SalidaInsumo = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    id_insumo: ins.id,
    cantidad: formCantidad.value!,
    motivo: formMotivo.value,
    registrado_por: auth.currentUser?.cedula ?? '',
    created_at: now,
  }

  const atendidoItem: Atendido = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    cedula_personal: auth.currentUser?.cedula ?? '',
    cedula_atendido: formCedula.value,
    nombre_atendido: formNombre.value,
    telefono_contacto: '',
    fecha_hora_atencion: now,
    edad: formEdad.value,
    sexo: formSexo.value || null,
    tipo_atencion: null,
    referido: false,
    vulnerabilidad: [],
    notas: formMotivo.value || '',
    area_registro: 'logistica',
    lugar_vivia: formLugarVivia.value || null,
    lugar_actual: formLugarActual.value || null,
    motivo_atencion: null,
    insumo_entregado: ins.descripcion || null,
    especie: null,
    posee_tutor: null,
    rescatado: null,
    en_adopcion: null,
    diagnostico_tentativo: null,
    status_sync: 'pending',
  }

  await withLoading(async () => {
    await salidasStore.create(salidaItem)
    await atendidosStore.create(atendidoItem)
  }, 'Registrando entrega...')

  resetForm()
  toast.success('Entrega registrada — inventario actualizado')
}

function confirmarEliminar(s: SalidaInsumo) {
  salidaToDelete.value = s
  showDeleteDialog.value = true
}

async function ejecutarEliminar() {
  if (!salidaToDelete.value) return
  await salidasStore.remove(salidaToDelete.value.id)
  showDeleteDialog.value = false
  salidaToDelete.value = null
  toast.success('Salida eliminada')
}

function beneficiario(salida: SalidaInsumo): { nombre: string; cedula: string } | null {
  const match = atendidosStore.list.find(
    (a) =>
      a.id_mision === missionId &&
      a.area_registro === 'logistica' &&
      a.insumo_entregado === insumosMision.value.find((i) => i.id === salida.id_insumo)?.descripcion &&
      Math.abs(new Date(a.fecha_hora_atencion).getTime() - new Date(salida.created_at).getTime()) < 5000,
  )
  return match ? { nombre: match.nombre_atendido, cedula: match.cedula_atendido } : null
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    insumosStore.load(),
    salidasStore.load(),
    atendidosStore.load(),
  ])
})
</script>

<template>
  <div>
    <div v-if="mission" class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-3">
      <div>
        <div class="flex items-center gap-3">
          <BaseButton variant="ghost" @click="router.push(`/misiones/${missionId}`)">
            <ArrowLeft :size="18" /> Volver
          </BaseButton>
          <h1 class="text-2xl text-brand m-0">Dispensación de Insumos</h1>
        </div>
        <p class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.municipio }}, {{ mission.estado }}</p>
      </div>
      <BaseButton variant="primary" @click="showForm = !showForm">
        <Plus :size="18" /> Registrar Entrega
      </BaseButton>
    </div>

    <BaseCard title="Inventario Actual">
      <BaseTable
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Insumo' },
          { key: 'stock_original', label: 'Stock Original' },
          { key: 'dispensado', label: 'Dispensado' },
          { key: 'disponible', label: 'Disponible' },
        ]"
        :rows="insumosMision.map(i => ({
          ...i,
          stock_original: i.cantidad,
          dispensado: totalSalidasPorInsumo.get(i.id) ?? 0,
          disponible: stockDisponible(i),
        })) as unknown as Record<string, unknown>[]"
      />
    </BaseCard>

    <div v-if="showForm" class="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
      <h3 class="m-0 text-brand text-base font-semibold">Nueva Entrega</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseInput v-model="formCedula" label="Cédula del Beneficiario" required :error="formErrors.cedula" @update:model-value="formErrors.cedula = ''" />
        <BaseInput v-model="formNombre" label="Nombre Completo" required :error="formErrors.nombre" @update:model-value="formErrors.nombre = ''" />
        <BaseInput v-model="formEdad" label="Edad" type="number" min="0" max="150" :error="formErrors.edad" />
        <BaseSelect v-model="formSexo" label="Sexo" :options="sexoOptions" :error="formErrors.sexo" />
        <BaseInput v-model="formLugarVivia" label="Lugar donde vivía" :error="formErrors.lugar_vivia" />
        <BaseInput v-model="formLugarActual" label="Lugar actual" :error="formErrors.lugar_actual" />
      </div>
      <hr class="border-border-light my-1" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseSelect
          v-model="formIdInsumo"
          label="Insumo a Entregar"
          required
          :options="insumoOptions"
          :error="formErrors.id_insumo"
        />
        <div class="flex flex-col gap-1.5">
          <label for="cantidad-salida" class="text-sm font-semibold text-text">
            Cantidad<span class="text-danger ml-0.5">*</span>
          </label>
          <div
            class="flex items-center border rounded-lg overflow-hidden"
            :class="formErrors.cantidad ? 'border-danger' : 'border-border'"
          >
            <button
              type="button"
              class="flex items-center justify-center w-10 h-10 text-lg font-bold text-primary bg-gray-50 hover:bg-gray-100 transition-colors border-r border-border select-none cursor-pointer"
              :class="formCantidad && formCantidad > 1 ? '' : 'opacity-30'"
              :disabled="!formCantidad || formCantidad <= 1"
              @click="formCantidad = formCantidad ? formCantidad - 1 : null"
            >−</button>
            <input
              id="cantidad-salida"
              type="number"
              min="1"
              :max="insumoSeleccionado ? stockDisponible(insumoSeleccionado) : undefined"
              class="flex-1 w-0 min-w-0 text-center font-sans text-sm py-2.5 outline-none border-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              :value="formCantidad ?? ''"
              required
              @input="formCantidad = parseInt(($event.target as HTMLInputElement).value) || null"
            />
            <button
              type="button"
              class="flex items-center justify-center w-10 h-10 text-lg font-bold text-primary bg-gray-50 hover:bg-gray-100 transition-colors border-l border-border select-none cursor-pointer"
              :class="insumoSeleccionado && formCantidad && formCantidad < stockDisponible(insumoSeleccionado) ? '' : 'opacity-30'"
              :disabled="!insumoSeleccionado || (formCantidad !== null && formCantidad >= (insumoSeleccionado ? stockDisponible(insumoSeleccionado) : 999999))"
              @click="formCantidad = Math.min((formCantidad ?? 0) + 1, insumoSeleccionado ? stockDisponible(insumoSeleccionado) : 999999)"
            >+</button>
          </div>
          <p v-if="formErrors.cantidad" class="text-danger text-xs m-0">{{ formErrors.cantidad }}</p>
        </div>
        <div class="col-span-2">
          <BaseInput v-model="formMotivo" label="Motivo de la Entrega" placeholder="Ej: distribución comunitaria, emergencia familiar, etc." />
        </div>
      </div>
      <div v-if="insumoSeleccionado" class="text-sm text-text-secondary">
        Insumo seleccionado: <strong>{{ insumoSeleccionado.descripcion }}</strong> — Disponible: <strong>{{ stockDisponible(insumoSeleccionado) }} {{ insumoSeleccionado.unidad }}</strong>
      </div>
      <div class="flex gap-2 justify-end">
        <BaseButton variant="primary" @click="registrarEntrega" :loading="saving"><Package :size="16" /> Registrar Entrega</BaseButton>
        <BaseButton variant="ghost" @click="resetForm">Cancelar</BaseButton>
      </div>
    </div>

    <BaseCard title="Historial de Entregas">
      <BaseTable
        :columns="[
          { key: 'beneficiario', label: 'Beneficiario' },
          { key: 'cedula_benef', label: 'Cédula' },
          { key: 'descripcion', label: 'Insumo' },
          { key: 'cantidad', label: 'Cantidad' },
          { key: 'unidad', label: 'Unidad' },
          { key: 'motivo', label: 'Motivo' },
          { key: 'registrado_por', label: 'Registró' },
          { key: 'created_at', label: 'Fecha' },
          { key: 'acciones', label: '' },
        ]"
        :rows="salidasMision.map(s => {
          const ins = insumosMision.find(i => i.id === s.id_insumo)
          const ben = beneficiario(s)
          return {
            ...s,
            beneficiario: ben?.nombre ?? '—',
            cedula_benef: ben?.cedula ?? '—',
            descripcion: ins?.descripcion ?? '—',
            unidad: ins?.unidad ?? '',
          }
        }).reverse() as unknown as Record<string, unknown>[]"
      >
        <template #cell-acciones="{ row }">
          <BaseButton size="sm" variant="danger" @click="confirmarEliminar(row as unknown as SalidaInsumo)">
            <Trash2 :size="14" />
          </BaseButton>
        </template>
      </BaseTable>
      <p v-if="salidasMision.length === 0" class="text-text-secondary italic py-4 text-center">
        No hay entregas registradas.
      </p>
    </BaseCard>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar entrega"
      message="¿Eliminar esta entrega? Se restablecerá el stock disponible."
      confirm-text="Eliminar"
      variant="danger"
      @confirm="ejecutarEliminar"
      @cancel="showDeleteDialog = false; salidaToDelete = null"
    />
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
    <p>Cargando...</p>
  </div>
  </div>
</template>
