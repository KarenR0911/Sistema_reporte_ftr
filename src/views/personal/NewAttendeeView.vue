<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useAtendidosStore } from '@/stores/atendidos'
import { useAuthStore } from '@/stores/auth'
import type { Atendido } from '@/types'

const route = useRoute()
const router = useRouter()
const misionesStore = useMisionesStore()
const atendidosStore = useAtendidosStore()
const auth = useAuthStore()

const missionId = route.params.id_mision as string
const mission = computed(() => misionesStore.getById(missionId))

const formCedula = ref('')
const formNombre = ref('')
const formTelefono = ref('')
const formNotas = ref('')
const formInsumos = ref('')

async function registerAttendee() {
  if (!formCedula.value.trim() || !formNombre.value.trim()) {
    alert('Cédula y nombre del atendido son obligatorios.')
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
    notas: formNotas.value,
    insumos_dados: formInsumos.value,
    status_sync: 'pending',
  }
  await atendidosStore.create(item)
  formCedula.value = ''
  formNombre.value = ''
  formTelefono.value = ''
  formNotas.value = ''
  formInsumos.value = ''
}

onMounted(() => {
  misionesStore.load()
  atendidosStore.load()
})
</script>

<template>
  <div class="new-attendee" v-if="mission">
    <div class="header-row">
      <div>
        <h1 class="page-title">Registrar Atención</h1>
        <p class="mission-info">{{ mission.municipio }}, {{ mission.estado }}</p>
      </div>
      <BaseButton variant="ghost" @click="router.push('/personal')">Volver</BaseButton>
    </div>

    <BaseCard title="Datos de la Persona Atendida">
      <div class="form-grid">
        <BaseInput v-model="formCedula" label="Cédula del Atendido" required />
        <BaseInput v-model="formNombre" label="Nombre Completo" required />
        <BaseInput v-model="formTelefono" label="Teléfono de Contacto" />
        <BaseInput v-model="formNotas" label="Notas de la Atención" />
        <BaseInput v-model="formInsumos" label="Insumos Dados" placeholder="Ej: 2 vendas, 1 pastilla" />
      </div>
      <BaseButton variant="primary" @click="registerAttendee">Registrar Atención</BaseButton>
    </BaseCard>

    <BaseCard title="Atenciones Registradas en esta Misión">
      <BaseTable
        :columns="[
          { key: 'nombre_atendido', label: 'Nombre' },
          { key: 'cedula_atendido', label: 'Cédula' },
          { key: 'fecha_hora_atencion', label: 'Fecha' },
          { key: 'status_sync', label: 'Sync' },
        ]"
        :rows="atendidosStore.getByMision(missionId) as unknown as Record<string, unknown>[]"
      >
        <template #cell-status_sync="{ value }">
          <span class="sync-badge" :class="String(value)">● {{ value }}</span>
        </template>
      </BaseTable>
    </BaseCard>
  </div>
  <div v-else class="loading-state">
    <p>Cargando misión...</p>
    <BaseButton variant="ghost" @click="router.push('/personal')">Volver</BaseButton>
  </div>
</template>

<style scoped>
.new-attendee { display: flex; flex-direction: column; gap: 24px; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.mission-info { color: #666; margin: 4px 0 0; font-size: 0.9rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.sync-badge { font-size: 0.8rem; font-weight: 600; }
.sync-badge.pending { color: #E65100; }
.sync-badge.synced { color: #2E7D32; }
.loading-state { padding: 48px; text-align: center; color: #666; }
</style>
