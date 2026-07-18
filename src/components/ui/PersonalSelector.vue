<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { getSupabase, getAuthSupabase } from '@/lib/supabase'
import { getAll, addItem } from '@/db'
import type { Usuario } from '@/types'

const props = defineProps<{
  modelValue: Usuario[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Usuario[]]
}>()

const personalDisponible = ref<Usuario[]>([])
const searchPersonal = ref('')
const filtroTipo = ref('')
const filtroArea = ref('')

const selectedIds = computed(() => new Set(props.modelValue.map((u) => u.id)))

const areasDisponibles = computed(() => {
  const areas = new Set(personalDisponible.value.map((p) => p.area_voluntariado).filter(Boolean))
  return [...areas].sort()
})

const filteredPersonal = computed(() => {
  let list = personalDisponible.value
  const q = searchPersonal.value.trim().toLowerCase()
  if (q) list = list.filter((p) => p.nombre.toLowerCase().includes(q) || p.cedula.toLowerCase().includes(q))
  if (filtroTipo.value) list = list.filter((p) => p.categoria_voluntariado === filtroTipo.value)
  if (filtroArea.value) list = list.filter((p) => p.area_voluntariado === filtroArea.value)
  return list
})

const isOnline = computed(() => navigator.onLine)

const allSelected = computed(
  () =>
    filteredPersonal.value.length > 0 &&
    filteredPersonal.value.every((p) => selectedIds.value.has(p.id)),
)

function togglePersonal(p: Usuario) {
  const s = new Set(selectedIds.value)
  if (s.has(p.id)) {
    emit('update:modelValue', props.modelValue.filter((u) => u.id !== p.id))
  } else {
    emit('update:modelValue', [...props.modelValue, p])
  }
}

function toggleAllPersonal() {
  const ids = new Set(filteredPersonal.value.map((p) => p.id))
  if (allSelected.value) {
    emit('update:modelValue', props.modelValue.filter((u) => !ids.has(u.id)))
  } else {
    const existingIds = new Set(props.modelValue.map((u) => u.id))
    const toAdd = filteredPersonal.value.filter((p) => !existingIds.has(p.id))
    emit('update:modelValue', [...props.modelValue, ...toAdd])
  }
}

async function loadFromSupabase() {
  const { data: { session } } = await getSupabase().auth.getSession()
  if (!session) return
  const client = getAuthSupabase(session.access_token)
  const { data } = await client.from('perfiles').select('*').eq('rol', 'personal')
  if (!data) return
  const users: Usuario[] = data.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    cedula: p.cedula as string,
    nombre: p.nombre as string,
    email: (p.email as string) ?? '',
    rol: 'personal' as const,
    activo: (p.activo as boolean) ?? true,
    categoria_voluntariado: p.categoria_voluntariado as Usuario['categoria_voluntariado'],
    especialidad: (p.especialidad as string) ?? '',
    area_voluntariado: (p.area_voluntariado as string) ?? '',
  }))
  personalDisponible.value = users
  for (const u of users) {
    await addItem('usuarios', u).catch(() => {})
  }
}

onMounted(async () => {
  const local = await getAll<Usuario>('usuarios')
  personalDisponible.value = local.filter((u) => u.rol === 'personal' && u.activo)
  if (navigator.onLine) {
    await loadFromSupabase()
  }
})
</script>

<template>
  <div>
    <p class="text-sm text-text-secondary mb-3">
      Selecciona los voluntarios y profesionales que participarán en esta misión.
    </p>
    <div v-if="personalDisponible.length === 0" class="py-6 text-center text-text-secondary italic">
      {{ isOnline ? 'No hay personal disponible. Crea usuarios con rol "Personal" desde el panel de Usuarios.' : 'Modo offline: sin personal disponible. Conéctate para sincronizar.' }}
    </div>
    <template v-else>
      <div class="flex items-center gap-3 mb-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" :size="18" />
          <input
            v-model="searchPersonal"
            type="text"
            placeholder="Buscar por nombre o cédula..."
            class="w-full pl-10 pr-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 font-sans"
          />
        </div>
        <select
          v-model="filtroTipo"
          class="border border-border rounded-lg text-sm bg-white px-3 py-2.5 focus:outline-none focus:border-primary font-sans"
        >
          <option value="">Todos los tipos</option>
          <option value="estudiante">Estudiante</option>
          <option value="profesional">Profesional</option>
          <option value="voluntario">Voluntario</option>
        </select>
        <select
          v-model="filtroArea"
          class="border border-border rounded-lg text-sm bg-white px-3 py-2.5 focus:outline-none focus:border-primary font-sans"
        >
          <option value="">Todas las áreas</option>
          <option v-for="a in areasDisponibles" :key="a" :value="a">{{ a }}</option>
        </select>
        <BaseButton variant="secondary" size="sm" @click="toggleAllPersonal">
          {{ allSelected ? 'Deseleccionar todos' : 'Seleccionar todos' }}
        </BaseButton>
      </div>
      <p class="text-xs text-text-muted mb-2">
        {{ filteredPersonal.length }} de {{ personalDisponible.length }} disponibles
        · {{ props.modelValue.length }} seleccionados
      </p>
      <div v-if="filteredPersonal.length === 0" class="text-sm text-text-muted italic text-center py-4">
        No se encontraron resultados para "{{ searchPersonal }}"
      </div>
      <div v-else class="flex flex-col gap-2 mb-4 max-h-75 overflow-y-auto">
        <label
          v-for="p in filteredPersonal"
          :key="p.id"
          class="flex items-center gap-3 px-3.5 py-2.5 border-2 rounded-lg cursor-pointer transition-all"
          :class="selectedIds.has(p.id) ? 'border-primary bg-primary/5' : 'border-border-light'"
        >
          <input
            type="checkbox"
            :checked="selectedIds.has(p.id)"
            @change="togglePersonal(p)"
            class="w-4.5 h-4.5 accent-primary"
          />
          <div class="flex flex-col">
            <span class="font-semibold text-[0.95rem]">{{ p.nombre }}</span>
            <span class="text-xs text-text-secondary">{{ p.cedula }}</span>
            <span v-if="p.categoria_voluntariado" class="text-xs text-text-muted italic">
              {{ p.categoria_voluntariado }}<span v-if="p.especialidad"> — {{ p.especialidad }}</span>
              <span v-if="p.area_voluntariado"> · {{ p.area_voluntariado }}</span>
            </span>
          </div>
        </label>
      </div>
    </template>
  </div>
</template>
