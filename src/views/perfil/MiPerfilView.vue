<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = computed(() => auth.currentUser)

function labelRol(r: string | undefined): string {
  return r === 'director' ? 'Director'
    : r === 'administrador' ? 'Administrador'
    : r === 'coordinador' ? 'Coordinador'
    : r === 'personal' ? 'Personal'
    : '—'
}
</script>

<template>
  <div v-if="user" class="flex flex-col gap-6 max-w-2xl mx-auto">
    <h1 class="text-2xl text-brand m-0">Mi Perfil</h1>

    <BaseCard title="Información General">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Cédula</span>
          <span class="text-base">{{ user.cedula }}</span>
        </div>
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Nombre</span>
          <span class="text-base">{{ user.nombre }}</span>
        </div>
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Email</span>
          <span class="text-base">{{ user.email }}</span>
        </div>
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Rol</span>
          <StatusBadge :status="user.rol" />
        </div>
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Estado</span>
          <StatusBadge :status="user.activo ? 'activo' : 'inactivo'" />
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="user.categoria_voluntariado" title="Datos del Voluntariado">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Categoría</span>
          <span class="text-base capitalize">{{ user.categoria_voluntariado }}</span>
        </div>
        <div v-if="user.especialidad">
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Especialidad</span>
          <span class="text-base capitalize">{{ user.especialidad.replace(/_/g, ' ') }}</span>
        </div>
        <div v-if="user.area_voluntariado" class="md:col-span-2">
          <span class="font-semibold text-text-secondary block text-xs uppercase tracking-wide mb-0.5">Área de Voluntariado</span>
          <span class="text-base capitalize">{{ user.area_voluntariado.replace(/_/g, ' ') }}</span>
        </div>
      </div>
    </BaseCard>
  </div>
  <div v-else class="py-12 text-center text-text-secondary">
    <p>No se encontró información del perfil.</p>
  </div>
</template>
