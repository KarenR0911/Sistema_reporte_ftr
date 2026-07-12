<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import PersonalSelector from '@/components/ui/PersonalSelector.vue'
import { MapPin, Truck, Users, Package, Plus, ArrowLeft, Save } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useTransporteStore } from '@/stores/transporte'
import { usePersonalStore } from '@/stores/personal'
import { useInsumosStore } from '@/stores/insumos'
import { useToastStore } from '@/stores/toast'
import type { Mision, Transporte, PersonalMision, InsumoLlevado, Usuario } from '@/types'

const router = useRouter()
const misionesStore = useMisionesStore()
const transporteStore = useTransporteStore()
const personalStore = usePersonalStore()
const insumosStore = useInsumosStore()
const toast = useToastStore()

const step = ref(1)
const selectedPersonal = ref<Usuario[]>([])

const misionForm = ref({
  direccion: '',
  municipio: '',
  estado: '',
})

const transportes = ref<Omit<Transporte, 'id' | 'id_mision' | 'status_sync'>[]>([])
const transportForm = ref({ tipo_transporte: '', numero_placa: '', nombre_conductor: '' })

const insumos = ref<Omit<InsumoLlevado, 'id' | 'id_mision' | 'status_sync'>[]>([])
const insumoForm = ref({ categoria: '', descripcion: '', cantidad: '', unidad: '', observaciones: '' })

function validateStep(): boolean {
  if (step.value === 1) {
    if (!misionForm.value.direccion.trim() || !misionForm.value.municipio.trim() || !misionForm.value.estado.trim()) {
      toast.error('Completa todos los campos de la zona (dirección, municipio, estado).')
      return false
    }
    return true
  }
  if (step.value === 3 && selectedPersonal.value.length === 0) {
    toast.error('Selecciona al menos un voluntario o profesional para la misión.')
    return false
  }
  return true
}

function goToStep(target: number) {
  if (target < step.value) {
    step.value = target
    return
  }
  for (let i = step.value; i < target; i++) {
    if (!validateStepFor(i)) return
  }
  step.value = target
}

function validateStepFor(s: number): boolean {
  if (s === 1) {
    if (!misionForm.value.direccion.trim() || !misionForm.value.municipio.trim() || !misionForm.value.estado.trim()) {
      toast.error('Completa todos los campos de la zona antes de avanzar.')
      return false
    }
    return true
  }
  return true
}

function nextStep() {
  if (!validateStep()) return
  step.value++
}

function prevStep() {
  step.value--
}

function addTransporte() {
  if (!transportForm.value.tipo_transporte || !transportForm.value.numero_placa || !transportForm.value.nombre_conductor) {
    toast.error('Completa todos los datos del transporte.')
    return
  }
  transportes.value.push({ ...transportForm.value })
  transportForm.value = { tipo_transporte: '', numero_placa: '', nombre_conductor: '' }
}

function removeTransporte(idx: number) {
  transportes.value.splice(idx, 1)
}

function addInsumo() {
  if (!insumoForm.value.categoria || !insumoForm.value.descripcion || !insumoForm.value.cantidad) {
    toast.error('Completa al menos categoría, descripción y cantidad del insumo.')
    return
  }
  const cantidad = Number(insumoForm.value.cantidad)
  if (cantidad <= 0) {
    toast.error('La cantidad debe ser mayor a 0.')
    return
  }
  insumos.value.push({ ...insumoForm.value, cantidad, estatus_cargamento: 'entregado' })
  insumoForm.value = { categoria: '', descripcion: '', cantidad: '', unidad: '', observaciones: '' }
}

function removeInsumo(idx: number) {
  insumos.value.splice(idx, 1)
}

async function saveMision() {
  if (insumos.value.length === 0) {
    toast.error('Debes agregar al menos un insumo a la misión.')
    return
  }
  const id_mision = crypto.randomUUID()
  const mision: Mision = {
    id: id_mision,
    ...misionForm.value,
    fecha_inicio: new Date().toISOString(),
    estatus_mision: 'activa',
    status_sync: 'pending',
  }
  await misionesStore.create(mision)

  for (const t of transportes.value) {
    const item: Transporte = { id: crypto.randomUUID(), id_mision, ...t, status_sync: 'pending' }
    await transporteStore.create(item)
  }

  for (const p of selectedPersonal.value) {
      const item: PersonalMision = {
        id: crypto.randomUUID(),
        id_mision,
        cedula: p.cedula,
        nombre: p.nombre,
        categoria_voluntariado: p.categoria_voluntariado ?? 'voluntario',
        especialidad: p.especialidad ?? '',
        area_voluntariado: p.area_voluntariado ?? '',
        status_sync: 'pending',
      }
    await personalStore.create(item)
  }

  for (const i of insumos.value) {
    const item: InsumoLlevado = {
      id: crypto.randomUUID(),
      id_mision,
      ...i,
      estatus_cargamento: 'entregado',
      status_sync: 'pending',
    }
    await insumosStore.create(item)
  }

  toast.success('Misión creada exitosamente')
  router.push('/misiones')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" @click="router.push('/misiones')"><ArrowLeft :size="18" /> Volver</BaseButton>
      <h1 class="text-2xl text-brand m-0">Nueva Misión</h1>
    </div>

    <div class="flex gap-2">
      <div
        class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border-2 cursor-pointer text-sm font-semibold transition-all"
        :class="step === 1 ? 'border-primary text-primary' : step > 1 ? 'border-success text-success' : 'border-border-light text-text-secondary'"
        @click="goToStep(1)"
      >
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
          :class="step === 1 ? 'bg-primary text-white' : step > 1 ? 'bg-success text-white' : 'bg-border-light'"
        >
          <MapPin :size="16" />
        </span>
        Zona
      </div>
      <div
        class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border-2 cursor-pointer text-sm font-semibold transition-all"
        :class="step === 2 ? 'border-primary text-primary' : step > 2 ? 'border-success text-success' : 'border-border-light text-text-secondary'"
        @click="goToStep(2)"
      >
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
          :class="step === 2 ? 'bg-primary text-white' : step > 2 ? 'bg-success text-white' : 'bg-border-light'"
        >
          <Truck :size="16" />
        </span>
        Transporte
      </div>
      <div
        class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border-2 cursor-pointer text-sm font-semibold transition-all"
        :class="step === 3 ? 'border-primary text-primary' : step > 3 ? 'border-success text-success' : 'border-border-light text-text-secondary'"
        @click="goToStep(3)"
      >
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
          :class="step === 3 ? 'bg-primary text-white' : step > 3 ? 'bg-success text-white' : 'bg-border-light'"
        >
          <Users :size="16" />
        </span>
        Personal
      </div>
      <div
        class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border-2 cursor-pointer text-sm font-semibold transition-all"
        :class="step === 4 ? 'border-primary text-primary' : step > 4 ? 'border-success text-success' : 'border-border-light text-text-secondary'"
        @click="goToStep(4)"
      >
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
          :class="step === 4 ? 'bg-primary text-white' : step > 4 ? 'bg-success text-white' : 'bg-border-light'"
        >
          <Package :size="16" />
        </span>
        Insumos
      </div>
    </div>

    <BaseCard v-if="step === 1" title="Datos de la Zona">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <BaseInput v-model="misionForm.direccion" label="Dirección" required />
        <BaseInput v-model="misionForm.municipio" label="Municipio" required />
        <BaseInput v-model="misionForm.estado" label="Estado" required />
      </div>
      <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
    </BaseCard>

    <BaseCard v-if="step === 2" title="Transporte">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <BaseInput v-model="transportForm.tipo_transporte" label="Tipo de Transporte" placeholder="Camioneta, Autobús..." />
        <BaseInput v-model="transportForm.numero_placa" label="Número de Placa" />
        <BaseInput v-model="transportForm.nombre_conductor" label="Nombre del Conductor" />
      </div>
      <BaseButton variant="secondary" @click="addTransporte" class="mb-3"><Plus :size="18" /> Agregar Transporte</BaseButton>
      <BaseTable
        v-if="transportes.length"
        :columns="[
          { key: 'tipo_transporte', label: 'Tipo' },
          { key: 'numero_placa', label: 'Placa' },
          { key: 'nombre_conductor', label: 'Conductor' },
          { key: 'acciones', label: '' },
        ]"
        :rows="transportes as unknown as Record<string, unknown>[]"
      >
        <template #cell-acciones="{ row }">
          <BaseButton size="sm" variant="danger" @click="removeTransporte(transportes.indexOf(row as any))">X</BaseButton>
        </template>
      </BaseTable>
      <div class="flex justify-between mt-4">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-if="step === 3" title="Seleccionar Personal / Voluntarios">
      <PersonalSelector v-model="selectedPersonal" />
      <div class="flex justify-between mt-4">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-if="step === 4" title="Insumos Llevados">
      <p class="text-sm text-text-secondary mb-3">Registra los insumos que se llevan a la misión. El estatus se definirá al finalizar.</p>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <BaseInput v-model="insumoForm.categoria" label="Categoría" placeholder="Medicinas, Alimentos..." />
        <BaseInput v-model="insumoForm.descripcion" label="Descripción" />
        <BaseInput v-model="insumoForm.cantidad" label="Cantidad" type="number" />
        <BaseInput v-model="insumoForm.unidad" label="Unidad" placeholder="kg, unidades, litros..." />
        <BaseInput v-model="insumoForm.observaciones" label="Observaciones" />
      </div>
      <BaseButton variant="secondary" @click="addInsumo" class="mb-3"><Plus :size="18" /> Agregar Insumo</BaseButton>
      <BaseTable
        v-if="insumos.length"
        :columns="[
          { key: 'categoria', label: 'Categoría' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'cantidad', label: 'Cant.' },
          { key: 'acciones', label: '' },
        ]"
        :rows="insumos as unknown as Record<string, unknown>[]"
      >
        <template #cell-acciones="{ row }">
          <BaseButton size="sm" variant="danger" @click="removeInsumo(insumos.indexOf(row as any))">X</BaseButton>
        </template>
      </BaseTable>
      <div class="flex justify-between mt-4">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="saveMision"><Save :size="18" /> Guardar Misión</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
