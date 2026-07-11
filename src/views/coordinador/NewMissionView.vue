<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { MapPin, Truck, Users, Package, Plus, ArrowLeft, Save } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useTransporteStore } from '@/stores/transporte'
import { usePersonalStore } from '@/stores/personal'
import { useInsumosStore } from '@/stores/insumos'
import { supabase } from '@/lib/supabase'
import type { Mision, Transporte, PersonalMision, InsumoLlevado, Usuario } from '@/types'

const router = useRouter()
const misionesStore = useMisionesStore()
const transporteStore = useTransporteStore()
const personalStore = usePersonalStore()
const insumosStore = useInsumosStore()

const step = ref(1)
const personalDisponible = ref<Usuario[]>([])
const selectedPersonal = ref<Set<string>>(new Set())

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
      alert('Completa todos los campos de la zona (dirección, municipio, estado).')
      return false
    }
    return true
  }
  if (step.value === 3 && selectedPersonal.value.size === 0) {
    alert('Selecciona al menos un voluntario o profesional para la misión.')
    return false
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

function togglePersonal(id: string) {
  const s = new Set(selectedPersonal.value)
  if (s.has(id)) { s.delete(id) } else { s.add(id) }
  selectedPersonal.value = s
}

function addTransporte() {
  if (!transportForm.value.tipo_transporte || !transportForm.value.numero_placa || !transportForm.value.nombre_conductor) {
    alert('Completa todos los datos del transporte.')
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
    alert('Completa al menos categoría, descripción y cantidad del insumo.')
    return
  }
  insumos.value.push({ ...insumoForm.value, cantidad: Number(insumoForm.value.cantidad) || 0, estatus_cargamento: 'entregado' })
  insumoForm.value = { categoria: '', descripcion: '', cantidad: '', unidad: '', observaciones: '' }
}

function removeInsumo(idx: number) {
  insumos.value.splice(idx, 1)
}

async function saveMision() {
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

  for (const pId of selectedPersonal.value) {
    const p = personalDisponible.value.find((u) => u.id === pId)
    if (!p) continue
    const item: PersonalMision = {
      id: crypto.randomUUID(),
      id_mision,
      cedula: p.cedula,
      nombre: p.nombre,
      categoria_voluntariado: p.categoria_voluntariado ?? 'voluntario',
      especialidad: p.especialidad ?? '',
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

  router.push('/coordinador')
}

onMounted(async () => {
  if (navigator.onLine) {
    const { data } = await supabase.from('perfiles').select('*').eq('rol', 'personal')
    if (data) {
      personalDisponible.value = data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        cedula: p.cedula as string,
        nombre: p.nombre as string,
        email: (p.email as string) ?? '',
        rol: 'personal' as const,
        password: '',
        activo: true,
        categoria_voluntariado: p.categoria_voluntariado as Usuario['categoria_voluntariado'],
        especialidad: (p.especialidad as string) ?? '',
        area_voluntariado: (p.area_voluntariado as string) ?? '',
      }))
      return
    }
  }
})
</script>

<template>
  <div class="new-mission">
    <h1 class="page-title">Nueva Misión</h1>

    <div class="steps">
      <div class="step" :class="{ active: step === 1, done: step > 1 }" @click="step = 1">
        <span class="step-num"><MapPin :size="16" /></span> Zona
      </div>
      <div class="step" :class="{ active: step === 2, done: step > 2 }" @click="step = 2">
        <span class="step-num"><Truck :size="16" /></span> Transporte
      </div>
      <div class="step" :class="{ active: step === 3, done: step > 3 }" @click="step = 3">
        <span class="step-num"><Users :size="16" /></span> Personal
      </div>
      <div class="step" :class="{ active: step === 4, done: step > 4 }" @click="step = 4">
        <span class="step-num"><Package :size="16" /></span> Insumos
      </div>
    </div>

    <BaseCard v-if="step === 1" title="Datos de la Zona">
      <div class="form-grid">
        <BaseInput v-model="misionForm.direccion" label="Dirección" required />
        <BaseInput v-model="misionForm.municipio" label="Municipio" required />
        <BaseInput v-model="misionForm.estado" label="Estado" required />
      </div>
      <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
    </BaseCard>

    <BaseCard v-if="step === 2" title="Transporte">
      <div class="form-grid">
        <BaseInput v-model="transportForm.tipo_transporte" label="Tipo de Transporte" placeholder="Camioneta, Autobús..." />
        <BaseInput v-model="transportForm.numero_placa" label="Número de Placa" />
        <BaseInput v-model="transportForm.nombre_conductor" label="Nombre del Conductor" />
      </div>
      <BaseButton variant="secondary" @click="addTransporte" class="mb"><Plus :size="18" /> Agregar Transporte</BaseButton>
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
      <div class="step-nav">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-if="step === 3" title="Seleccionar Personal / Voluntarios">
      <p class="hint">Selecciona los voluntarios y profesionales que participarán en esta misión.</p>
      <div v-if="personalDisponible.length === 0" class="empty-hint">
        No hay personal disponible. Crea usuarios con rol "Personal" desde el panel del Director.
      </div>
      <div v-else class="personal-list">
        <label
          v-for="p in personalDisponible"
          :key="p.id"
          class="personal-item"
          :class="{ selected: selectedPersonal.has(p.id) }"
        >
          <input
            type="checkbox"
            :checked="selectedPersonal.has(p.id)"
            @change="togglePersonal(p.id)"
          />
          <div class="personal-info">
            <span class="personal-name">{{ p.nombre }}</span>
            <span class="personal-cedula">{{ p.cedula }}</span>
            <span class="personal-meta" v-if="p.categoria_voluntariado">
              {{ p.categoria_voluntariado }}<span v-if="p.especialidad"> — {{ p.especialidad }}</span>
              <span v-if="p.area_voluntariado"> · {{ p.area_voluntariado }}</span>
            </span>
          </div>
        </label>
      </div>
      <div class="step-nav">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="nextStep">Siguiente</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-if="step === 4" title="Insumos Llevados">
      <p class="hint">Registra los insumos que se llevan a la misión. El estatus se definirá al finalizar.</p>
      <div class="form-grid">
        <BaseInput v-model="insumoForm.categoria" label="Categoría" placeholder="Medicinas, Alimentos..." />
        <BaseInput v-model="insumoForm.descripcion" label="Descripción" />
        <BaseInput v-model="insumoForm.cantidad" label="Cantidad" type="number" />
        <BaseInput v-model="insumoForm.unidad" label="Unidad" placeholder="kg, unidades, litros..." />
        <BaseInput v-model="insumoForm.observaciones" label="Observaciones" />
      </div>
      <BaseButton variant="secondary" @click="addInsumo" class="mb"><Plus :size="18" /> Agregar Insumo</BaseButton>
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
      <div class="step-nav">
        <BaseButton variant="ghost" @click="prevStep"><ArrowLeft :size="18" /> Atrás</BaseButton>
        <BaseButton variant="primary" @click="saveMision"><Save :size="18" /> Guardar Misión</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.new-mission { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.steps { display: flex; gap: 8px; }
.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  border-radius: 8px;
  border: 2px solid #E3E3E3;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}
.step.active { border-color: #145CAD; color: #145CAD; }
.step.done { border-color: #4CAF50; color: #4CAF50; }
.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #E3E3E3;
  font-size: 0.8rem;
  font-weight: 700;
}
.step.active .step-num { background: #145CAD; color: #fff; }
.step.done .step-num { background: #4CAF50; color: #fff; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.step-nav { display: flex; justify-content: space-between; margin-top: 16px; }
.mb { margin-bottom: 12px; }
.hint { font-size: 0.85rem; color: #666; margin-bottom: 12px; }
.empty-hint { padding: 24px; text-align: center; color: #666; font-style: italic; }
.personal-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 300px; overflow-y: auto; }
.personal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 2px solid #E3E3E3;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.personal-item.selected { border-color: #145CAD; background: rgba(20, 92, 173, 0.05); }
.personal-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: #145CAD; }
.personal-info { display: flex; flex-direction: column; }
.personal-name { font-weight: 600; font-size: 0.95rem; }
.personal-cedula { font-size: 0.8rem; color: #666; }
.personal-meta { font-size: 0.75rem; color: #999; font-style: italic; }
</style>
