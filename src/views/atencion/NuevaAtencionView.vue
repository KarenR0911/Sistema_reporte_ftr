<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { UserPlus, ArrowLeft, Eye } from '@lucide/vue'
import { useMisionesStore } from '@/stores/misiones'
import { usePersonalStore } from '@/stores/personal'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useLoading } from '@/composables/useLoading'
import { atencionSchema, atencionMedicinaSchema, atencionPsicologiaSchema, atencionVeterinariaSchema } from '@/lib/schemas'
import type { Atendido, TipoAtencion, AreaRegistro } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const personalStore = usePersonalStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()
const toast = useToastStore()
const { withLoading, saving } = useLoading()

const missionId = route.params.id_mision as string
const mission = computed(() => misionesStore.getById(missionId))

const currentPersonal = computed(() =>
  personalStore.list.find(
    (p) => p.id_mision === missionId && p.cedula === auth.currentUser?.cedula,
  ),
)

function mapArea(raw: string | undefined | null): AreaRegistro {
  if (!raw) return 'general'
  const lower = raw.toLowerCase()
  if (lower.includes('medicina')) return 'medicina_humana'
  if (lower.includes('salud mental') || lower.includes('psicologia') || lower.includes('psicol')) return 'psicologia'
  if (lower.includes('veterinaria') || lower.includes('veterin')) return 'veterinaria'
  return 'general'
}

const userArea = computed<AreaRegistro>(() => mapArea(currentPersonal.value?.area_voluntariado))

const areaLabel = computed(() => {
  const labels: Record<string, string> = {
    medicina_humana: 'Medicina Humana',
    psicologia: 'Psicología',
    veterinaria: 'Veterinaria',
    general: 'General',
  }
  return labels[userArea.value] ?? 'General'
})

const formCedula = ref('')
const formNombre = ref('')
const formEdad = ref<number | null>(null)
const formSexo = ref('')
const formTipoAtencion = ref('')
const formReferido = ref(false)
const formVulnerabilidades = ref<string[]>([])
const formTelefono = ref('')
const formNotas = ref('')
const formMotivoAtencion = ref('')
const formLugarVivia = ref('')
const formLugarActual = ref('')
const formEspecie = ref('')
const formPoseeTutor = ref(false)
const formRescatado = ref(false)
const formEnAdopcion = ref(false)
const formDiagnosticoTentativo = ref('')
const formErrors = ref<Record<string, string>>({})

const sexoOptions = [
  { value: '', label: 'Seleccionar…' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

const sexoAnimalOptions = [
  { value: '', label: 'Seleccionar…' },
  { value: 'masculino', label: 'Macho' },
  { value: 'femenino', label: 'Hembra' },
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

const showDetail = ref(false)
const selectedAtendido = ref<Atendido | null>(null)

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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    : val === 'otro' ? 'Otro'
    : '—'
}

function labelSexo(val: unknown): string {
  return val === 'masculino' ? 'Masculino'
    : val === 'femenino' ? 'Femenino'
    : val === 'otro' ? 'Otro'
    : '—'
}

function parseVuln(value: unknown): string[] {
  if (!value) return []
  try {
    const s = String(value)
    return s.startsWith('[') ? JSON.parse(s) : [s]
  } catch {
    return [String(value)]
  }
}

function labelVuln(v: string): string {
  return v === 'embarazada' ? 'Embarazada'
    : v === 'discapacidad' ? 'Discapacidad'
    : v === 'adulto_mayor' ? 'Adulto Mayor'
    : v === 'menor_no_acompanado' ? 'Menor solo'
    : v === 'enfermedad_cronica' ? 'Enf. Crónica'
    : v === 'otro' ? 'Otra'
    : v
}

function toggleVulnerabilidad(val: string) {
  const idx = formVulnerabilidades.value.indexOf(val)
  if (idx === -1) {
    formVulnerabilidades.value.push(val)
  } else {
    formVulnerabilidades.value.splice(idx, 1)
  }
}

function resetForm() {
  formCedula.value = ''
  formNombre.value = ''
  formEdad.value = null
  formSexo.value = ''
  formTipoAtencion.value = ''
  formReferido.value = false
  formVulnerabilidades.value = []
  formTelefono.value = ''
  formNotas.value = ''
  formMotivoAtencion.value = ''
  formLugarVivia.value = ''
  formLugarActual.value = ''
  formEspecie.value = ''
  formPoseeTutor.value = false
  formRescatado.value = false
  formEnAdopcion.value = false
  formDiagnosticoTentativo.value = ''
  formErrors.value = {}
}

function buildPayload(): Atendido {
  return {
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
    vulnerabilidad: formVulnerabilidades.value,
    notas: formNotas.value,
    area_registro: userArea.value,
    lugar_vivia: formLugarVivia.value || null,
    lugar_actual: formLugarActual.value || null,
    motivo_atencion: formMotivoAtencion.value || null,
    insumo_entregado: null,
    especie: formEspecie.value || null,
    posee_tutor: formPoseeTutor.value || null,
    rescatado: formRescatado.value || null,
    en_adopcion: formEnAdopcion.value || null,
    diagnostico_tentativo: formDiagnosticoTentativo.value || null,
    status_sync: 'pending',
  }
}

function validate(): boolean {
  formErrors.value = {}
  const base = {
    cedula_atendido: formCedula.value,
    nombre_atendido: formNombre.value,
    edad: formEdad.value,
    sexo: formSexo.value || null,
    telefono_contacto: formTelefono.value,
    notas: formNotas.value,
  }
  let result
  switch (userArea.value) {
    case 'medicina_humana':
      result = atencionMedicinaSchema.safeParse({
        ...base,
        motivo_atencion: formMotivoAtencion.value,
        lugar_vivia: formLugarVivia.value,
        lugar_actual: formLugarActual.value,
        tipo_atencion: formTipoAtencion.value || null,
        referido: formReferido.value,
        vulnerabilidad: formVulnerabilidades.value,
      })
      break
    case 'psicologia':
      result = atencionPsicologiaSchema.safeParse({
        ...base,
        motivo_atencion: formMotivoAtencion.value,
        lugar_vivia: formLugarVivia.value,
        lugar_actual: formLugarActual.value,
      })
      break
    case 'veterinaria':
      result = atencionVeterinariaSchema.safeParse({
        nombre_atendido: formNombre.value,
        especie: formEspecie.value,
        sexo: formSexo.value || null,
        edad: formEdad.value,
        posee_tutor: formPoseeTutor.value,
        rescatado: formRescatado.value,
        en_adopcion: formEnAdopcion.value,
        diagnostico_tentativo: formDiagnosticoTentativo.value,
        notas: formNotas.value,
      })
      break
    default:
      result = atencionSchema.safeParse({
        ...base,
        tipo_atencion: formTipoAtencion.value || null,
        referido: formReferido.value,
        vulnerabilidad: formVulnerabilidades.value,
      })
  }
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return false
  }
  return true
}

async function registerAttendee() {
  if (!validate()) return
  const item = buildPayload()
  await withLoading(() => atendidosStore.create(item), 'Registrando atención...')
  resetForm()
  toast.success('Registro guardado exitosamente')
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    personalStore.load(),
    atendidosStore.load(),
  ])
})
</script>

<template>
  <div>
    <div v-if="mission" class="flex flex-col gap-4 md:gap-6">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-3">
            <BaseButton variant="ghost" @click="router.push('/dashboard')"><ArrowLeft :size="18" /> Volver</BaseButton>
            <h1 class="text-2xl text-brand m-0">Registrar <span v-if="userArea !== 'general'">{{ areaLabel }}</span><span v-else>Atención</span></h1>
          </div>
          <p class="text-text-secondary mt-1 text-sm m-0 ml-12">{{ mission.municipio }}, {{ mission.estado }}</p>
          <p v-if="userArea !== 'general'" class="text-text-secondary mt-1 text-sm m-0 ml-12">
            Área: <strong>{{ areaLabel }}</strong>
          </p>
        </div>
      </div>

      <BaseCard v-if="userArea === 'general' || userArea === 'medicina_humana' || userArea === 'psicologia'" title="Datos de la Persona Atendida">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <BaseInput v-model="formCedula" label="Cédula de Identidad" required :error="formErrors.cedula_atendido" @update:model-value="formErrors.cedula_atendido = ''" />
          <BaseInput v-model="formNombre" label="Nombre Completo" required :error="formErrors.nombre_atendido" @update:model-value="formErrors.nombre_atendido = ''" />
          <BaseInput v-model="formEdad" label="Edad" type="number" min="0" max="150" :error="formErrors.edad" />
          <BaseSelect v-model="formSexo" label="Sexo" :options="sexoOptions" :error="formErrors.sexo" />
          <BaseInput v-model="formTelefono" label="Teléfono de Contacto" />
        </div>
      </BaseCard>

      <BaseCard v-if="userArea === 'veterinaria'" title="Datos del Animal">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <BaseInput v-model="formNombre" label="Nombre del Animal" required :error="formErrors.nombre_atendido" @update:model-value="formErrors.nombre_atendido = ''" />
          <BaseInput v-model="formEspecie" label="Especie" required placeholder="Perro, gato, etc." :error="formErrors.especie" @update:model-value="formErrors.especie = ''" />
          <BaseSelect v-model="formSexo" label="Sexo" :options="sexoAnimalOptions" :error="formErrors.sexo" />
          <BaseInput v-model="formEdad" label="Edad (años)" type="number" min="0" max="50" :error="formErrors.edad" />
        </div>
        <div class="flex flex-wrap gap-x-8 gap-y-2">
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" v-model="formPoseeTutor" class="w-4.5 h-4.5 accent-primary" />
            ¿Posee tutor?
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" v-model="formRescatado" class="w-4.5 h-4.5 accent-primary" />
            Rescatado
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" v-model="formEnAdopcion" class="w-4.5 h-4.5 accent-primary" />
            En adopción
          </label>
        </div>
      </BaseCard>

      <BaseCard title="Detalles de la Atención">
        <div class="grid grid-cols-1 gap-4">
          <template v-if="userArea === 'general'">
            <BaseSelect v-model="formTipoAtencion" label="Tipo de Atención" required :options="tipoAtencionOptions" :error="formErrors.tipo_atencion" />
            <div class="flex items-center gap-3">
              <input id="referido" type="checkbox" v-model="formReferido" class="w-4.5 h-4.5 accent-primary" />
              <label for="referido" class="text-sm font-medium cursor-pointer">Requiere referencia / derivación a otro servicio</label>
            </div>
            <fieldset class="border border-border rounded-lg p-4">
              <legend class="text-sm font-semibold text-text-secondary px-1">Vulnerabilidades (selecciona todas que apliquen)</legend>
              <div class="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
                <label v-for="opt in vulnerabilidadOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                  <input type="checkbox" :value="opt.value" :checked="formVulnerabilidades.includes(opt.value)" @change="toggleVulnerabilidad(opt.value)" class="w-4 h-4 accent-primary" />
                  {{ opt.label }}
                </label>
              </div>
            </fieldset>
          </template>

          <template v-if="userArea === 'medicina_humana'">
            <BaseInput v-model="formMotivoAtencion" label="Motivo de Atención" required :error="formErrors.motivo_atencion" @update:model-value="formErrors.motivo_atencion = ''" />
            <BaseInput v-model="formLugarVivia" label="Lugar donde vivía" required :error="formErrors.lugar_vivia" @update:model-value="formErrors.lugar_vivia = ''" />
            <BaseInput v-model="formLugarActual" label="Lugar actual" required :error="formErrors.lugar_actual" @update:model-value="formErrors.lugar_actual = ''" />
            <BaseSelect v-model="formTipoAtencion" label="Tipo de Atención" :options="tipoAtencionOptions" :error="formErrors.tipo_atencion" />
            <div class="flex items-center gap-3">
              <input id="referido" type="checkbox" v-model="formReferido" class="w-4.5 h-4.5 accent-primary" />
              <label for="referido" class="text-sm font-medium cursor-pointer">Requiere referencia / derivación</label>
            </div>
            <fieldset class="border border-border rounded-lg p-4">
              <legend class="text-sm font-semibold text-text-secondary px-1">Vulnerabilidades</legend>
              <div class="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
                <label v-for="opt in vulnerabilidadOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                  <input type="checkbox" :value="opt.value" :checked="formVulnerabilidades.includes(opt.value)" @change="toggleVulnerabilidad(opt.value)" class="w-4 h-4 accent-primary" />
                  {{ opt.label }}
                </label>
              </div>
            </fieldset>
          </template>

          <template v-if="userArea === 'psicologia'">
            <BaseInput v-model="formMotivoAtencion" label="Motivo de Atención" required :error="formErrors.motivo_atencion" @update:model-value="formErrors.motivo_atencion = ''" />
            <BaseInput v-model="formLugarVivia" label="Lugar donde vivía" required :error="formErrors.lugar_vivia" @update:model-value="formErrors.lugar_vivia = ''" />
            <BaseInput v-model="formLugarActual" label="Lugar actual" required :error="formErrors.lugar_actual" @update:model-value="formErrors.lugar_actual = ''" />
          </template>

          <template v-if="userArea === 'veterinaria'">
            <BaseInput v-model="formDiagnosticoTentativo" label="Diagnóstico Tentativo" required :error="formErrors.diagnostico_tentativo" @update:model-value="formErrors.diagnostico_tentativo = ''" />
          </template>

          <BaseInput v-model="formNotas" label="Notas" />
        </div>
      </BaseCard>

      <BaseCard title="Registros en esta Misión">
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
          :rows="atendidosStore.getByMision(missionId) as unknown as Record<string, unknown>[]"
        >
          <template #cell-sexo="{ value }">
            {{ labelSexo(value) }}
          </template>
          <template #cell-area_registro="{ value }">
            <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{{ value || 'general' }}</span>
          </template>
          <template #cell-acciones="{ row }">
            <BaseButton size="sm" variant="ghost" @click="openDetail(row as unknown as Atendido)">
              <Eye :size="16" />
            </BaseButton>
          </template>
        </BaseTable>
      </BaseCard>

      <div class="flex justify-end">
        <BaseButton variant="primary" size="lg" @click="registerAttendee" :loading="saving">
          <UserPlus :size="20" /> Guardar Registro
        </BaseButton>
      </div>
    </div>
    <div v-else class="py-12 text-center text-text-secondary">
      <p>Cargando misión...</p>
      <BaseButton variant="ghost" @click="router.push('/dashboard')">Volver</BaseButton>
    </div>

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
                  <span v-for="v in parseVuln(selectedAtendido.vulnerabilidad)" :key="v" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{{ labelVuln(v) }}</span>
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
  </div>
</template>
