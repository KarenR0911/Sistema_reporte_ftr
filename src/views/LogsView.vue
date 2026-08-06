<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { useLogsStore } from '@/stores/logs'
import { ENTIDADES_LOG } from '@/types'
import type { AccionLog, EntidadLog } from '@/types'

const logsStore = useLogsStore()

const search = ref('')
const filtroUsuario = ref('')
const filtroAccion = ref('')
const filtroEntidad = ref('')
const fechaDesde = ref('')
const fechaHasta = ref('')
const cargando = ref(true)

const ACCIONES: Record<AccionLog, string> = {
  crear: 'Crear',
  actualizar: 'Actualizar',
  eliminar: 'Eliminar',
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
}

const actionColors: Record<AccionLog, { bg: string; color: string }> = {
  crear: { bg: '#E8F5E9', color: '#2E7D32' },
  actualizar: { bg: '#E3F2FD', color: '#1565C0' },
  eliminar: { bg: '#FFEBEE', color: '#C62828' },
  login: { bg: '#E8F5E9', color: '#2E7D32' },
  logout: { bg: '#FFF3E0', color: '#E65100' },
}

const usuariosDisponibles = computed(() => {
  const map = new Map<string, string>()
  for (const l of logsStore.list) {
    const key = `${l.usuario_nombre} (${l.usuario_cedula})`
    map.set(key, key)
  }
  return Array.from(map, ([value, label]) => ({ value, label }))
})

const filteredLogs = computed(() => {
  const q = search.value.trim().toLowerCase()
  return logsStore.list
    .filter((l) => {
      if (filtroUsuario.value && `${l.usuario_nombre} (${l.usuario_cedula})` !== filtroUsuario.value) return false
      if (filtroAccion.value && l.accion !== filtroAccion.value) return false
      if (filtroEntidad.value && l.entidad !== filtroEntidad.value) return false
      if (fechaDesde.value && l.created_at < new Date(fechaDesde.value + 'T00:00:00').toISOString()) return false
      if (fechaHasta.value && l.created_at > new Date(fechaHasta.value + 'T23:59:59').toISOString()) return false
      if (q) {
        const hay = [l.usuario_nombre, l.usuario_cedula, l.usuario_rol, l.resumen, ACCIONES[l.accion], ENTIDADES_LOG[l.entidad]]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
        if (!hay) return false
      }
      return true
    })
})

const rowFields = computed<Record<string, unknown>[]>(() =>
  filteredLogs.value.map((l) => ({
    fecha: l.created_at,
    usuario: l.usuario_nombre,
    cedula: l.usuario_cedula,
    rol: l.usuario_rol,
    accion: l.accion,
    entidad: l.entidad,
    resumen: l.resumen ?? '—',
  })),
)

function formatFecha(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function clearFilters() {
  search.value = ''
  filtroUsuario.value = ''
  filtroAccion.value = ''
  filtroEntidad.value = ''
  fechaDesde.value = ''
  fechaHasta.value = ''
}

function printLogs() {
  window.print()
}

const entidadOptions = computed(() =>
  (Object.keys(ENTIDADES_LOG) as EntidadLog[]).map((k) => ({ value: k, label: ENTIDADES_LOG[k] })),
)
const accionOptions = computed(() =>
  (Object.keys(ACCIONES) as AccionLog[]).map((k) => ({ value: k, label: ACCIONES[k] })),
)

onMounted(async () => {
  try {
    await logsStore.load()
  } catch {
    // error silencioso
  }
  cargando.value = false
})
</script>

<template>
  <div>
    <div v-if="cargando" class="py-12 text-center text-text-secondary">
      <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>Cargando logs...</p>
    </div>
    <div v-else class="flex flex-col gap-4 md:gap-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print-hidden">
        <h1 class="text-2xl text-brand m-0">Logs del Sistema</h1>
        <div class="flex gap-2">
          <BaseButton v-if="filteredLogs.length" size="sm" variant="ghost" @click="printLogs">Imprimir</BaseButton>
        </div>
      </div>

      <BaseCard title="Filtros" class="print-hidden">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BaseInput v-model="search" label="Buscar" placeholder="Nombre, cédula, resumen..." />
          <BaseSelect v-model="filtroUsuario" label="Usuario" :options="usuariosDisponibles" />
          <BaseSelect v-model="filtroAccion" label="Acción" :options="accionOptions" />
          <BaseSelect v-model="filtroEntidad" label="Entidad" :options="entidadOptions" />
          <BaseInput v-model="fechaDesde" label="Desde" type="date" />
          <BaseInput v-model="fechaHasta" label="Hasta" type="date" />
          <div class="flex items-end pb-1">
            <BaseButton size="sm" variant="secondary" @click="clearFilters">Limpiar</BaseButton>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Actividad">
        <BaseTable
          :columns="[
            { key: 'fecha', label: 'Fecha' },
            { key: 'usuario', label: 'Usuario' },
            { key: 'rol', label: 'Rol' },
            { key: 'accion', label: 'Acción' },
            { key: 'entidad', label: 'Entidad' },
            { key: 'resumen', label: 'Detalle' },
          ]"
          :rows="rowFields"
        >
          <template #cell-fecha="{ value }">
            <span class="whitespace-nowrap text-text-secondary">{{ formatFecha(value as string) }}</span>
          </template>
          <template #cell-usuario="{ row }">
            <div>
              <div class="font-semibold text-text">{{ (row as any).usuario }}</div>
              <div class="text-xs text-text-secondary">{{ (row as any).cedula }}</div>
            </div>
          </template>
          <template #cell-accion="{ value }">
            <span
              class="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase"
              :style="actionColors[value as AccionLog]"
            >
              {{ ACCIONES[value as AccionLog] }}
            </span>
          </template>
          <template #cell-entidad="{ value }">
            {{ ENTIDADES_LOG[value as EntidadLog] }}
          </template>
        </BaseTable>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .print-hidden {
    display: none !important;
  }
}
</style>