<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { UserPlus, ArrowLeft } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useLoading } from '@/composables/useLoading'
import { atencionSchema } from '@/lib/schemas'
import type { Atendido, TipoAtencion } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()
const toast = useToastStore()
const { loading, withLoading, saving } = useLoading()

const missionId = route.params.id_mision as string
const mission = computed(() => misionesStore.getById(missionId))

const formCedula = ref('')
const formNombre = ref('')
const formEdad = ref<number | null>(null)
const formSexo = ref('')
const formTipoAtencion = ref('')
const formReferido = ref(false)
const formVulnerabilidades = ref<string[]>([])
const formTelefono = ref('')
const formNotas = ref('')
const formErrors = ref<Record<string, string>>({})

const sexoOptions = [
  { value: '', label: 'Seleccionar…' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

const tipoAtencionOptions: { value: TipoAtencion | ''; label: string }[] = [
  { value: '', label: 'Seleccionar…' },
  { value: 'medica', label: 'Atención Médica / Primeros Auxilios' },
  { value: 'psicosocial', label: 'Apoyo Psicosocial' },
  { value: 'alimento', label: 'Alimentación / Hidratación' },
  { value: 'refugio', label: 'Refugio / Abrigo Temporal' },
  { value: 'higiene', label: 'Kits de Higiene / Saneamiento' },
  { value: 'informacion', label: 'Orientación e Información' },
  { value: 'traslado', label: 'Traslado / Evacuación' },
  { value: 'otro', label: 'Otro' },
]

const vulnerabilidadOptions = [
  { value: 'embarazada', label: 'Embarazada' },
  { value: 'discapacidad', label: 'Persona con Discapacidad' },
  { value: 'adulto_mayor', label: 'Adulto Mayor (65+)' },
  { value: 'menor_no_acompanado', label: 'Menor No Acompañado' },
  { value: 'enfermedad_cronica', label: 'Enfermedad Crónica' },
  { value: 'otro', label: 'Otra Vulnerabilidad' },
]

function toggleVulnerabilidad(val: string) {
  const idx = formVulnerabilidades.value.indexOf(val)
  if (idx === -1) {
    formVulnerabilidades.value.push(val)
  } else {
    formVulnerabilidades.value.splice(idx, 1)
  }
}

async function registerAttendee() {
  formErrors.value = {}
  const result = atencionSchema.safeParse({
    cedula_atendido: formCedula.value,
    nombre_atendido: formNombre.value,
    edad: formEdad.value,
    sexo: formSexo.value || null,
    tipo_atencion: formTipoAtencion.value || null,
    referido: formReferido.value,
    vulnerabilidad: formVulnerabilidades.value,
    telefono_contacto: formTelefono.value,
    notas: formNotas.value,
  })
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }

  const item: Atendido = {
    id: crypto.randomUUID(),
    id_mision: missionId,
    cedula_personal: auth.currentUser?.cedula ?? '',
    cedula_atendido: formCedula.value,
    nombre_atendido: formNombre.value,
    telefono_contacto: formTelefono.value,
    fecha_hora_atencion: new Date().toISOString(),
    edad: formEdad.value,
    sexo: formSexo.value || null,
    tipo_atencion: (formTipoAtencion.value || null) as TipoAtencion | null,
    referido: formReferido.value,
    vulnerabilidad: JSON.stringify(formVulnerabilidades.value),
    notas: formNotas.value,
    status_sync: 'pending',
  }

  await withLoading(() => atendidosStore.create(item), 'Registrando atención...')

  formCedula.value = ''
  formNombre.value = ''
  formEdad.value = null
  formSexo.value = ''
  formTipoAtencion.value = ''
  formReferido.value = false
  formVulnerabilidades.value = []
  formTelefono.value = ''
  formNotas.value = ''
  toast.success('Atención registrada exitosamente')
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
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
        <BaseInput v-model="formCedula" label="Cédula de Identidad" required :error="formErrors.cedula_atendido" @update:model-value="formErrors.cedula_atendido = ''" />
        <BaseInput v-model="formNombre" label="Nombre Completo" required :error="formErrors.nombre_atendido" @update:model-value="formErrors.nombre_atendido = ''" />
        <BaseInput v-model="formEdad" label="Edad" type="number" min="0" max="150" :error="formErrors.edad" />
        <BaseSelect v-model="formSexo" label="Sexo" :options="sexoOptions" :error="formErrors.sexo" />
      </div>
    </BaseCard>

    <BaseCard title="Atención Brindada">
      <div class="grid grid-cols-1 gap-4">
        <BaseSelect v-model="formTipoAtencion" label="Tipo de Atención" required :options="tipoAtencionOptions" :error="formErrors.tipo_atencion" />

        <div class="flex items-center gap-3">
          <input
            id="referido"
            type="checkbox"
            v-model="formReferido"
            class="w-4.5 h-4.5 accent-primary"
          />
          <label for="referido" class="text-sm font-medium cursor-pointer">Requiere referencia / derivación a otro servicio</label>
        </div>

        <fieldset class="border border-border rounded-lg p-4">
          <legend class="text-sm font-semibold text-text-secondary px-1">Vulnerabilidades (selecciona todas que apliquen)</legend>
          <div class="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
            <label
              v-for="opt in vulnerabilidadOptions"
              :key="opt.value"
              class="flex items-center gap-2 cursor-pointer text-sm py-0.5"
            >
              <input
                type="checkbox"
                :value="opt.value"
                :checked="formVulnerabilidades.includes(opt.value)"
                @change="toggleVulnerabilidad(opt.value)"
                class="w-4 h-4 accent-primary"
              />
              {{ opt.label }}
            </label>
          </div>
        </fieldset>

        <BaseInput v-model="formTelefono" label="Teléfono de Contacto" />
        <BaseInput v-model="formNotas" label="Notas de la Atención" />
      </div>
    </BaseCard>

    <BaseCard title="Atenciones Registradas en esta Misión">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Nombre' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'tipo_atencion', label: 'Tipo' },
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
      <BaseButton variant="primary" size="lg" @click="registerAttendee" :loading="saving">
        <UserPlus :size="20" /> Registrar Atención
      </BaseButton>
    </div>
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <p>Cargando misión...</p>
    <BaseButton variant="ghost" @click="router.push('/dashboard')">Volver</BaseButton>
  </div>
</template>
