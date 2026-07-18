<script setup lang="ts">
defineProps<{
  status: string
  type?: 'sync' | 'mision' | 'cargamento' | 'necesidad'
}>()

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  synced: { bg: '#E8F5E9', color: '#2E7D32' },
  activa: { bg: '#E3F2FD', color: '#1565C0' },
  activo: { bg: '#E8F5E9', color: '#2E7D32' },
  inactivo: { bg: '#FFEBEE', color: '#C62828' },
  completada: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelada: { bg: '#FFEBEE', color: '#C62828' },
  entregado: { bg: '#E8F5E9', color: '#2E7D32' },
  retorno: { bg: '#FFF3E0', color: '#E65100' },
  reportado: { bg: '#FFF3E0', color: '#E65100' },
  enproceso: { bg: '#E3F2FD', color: '#1565C0' },
  atendido: { bg: '#E8F5E9', color: '#2E7D32' },
}
</script>

<template>
  <span
    class="badge"
    :style="{
      backgroundColor: statusColors[status]?.bg ?? '#F5F5F5',
      color: statusColors[status]?.color ?? '#333',
    }"
  >
    {{ status }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}
</style>
