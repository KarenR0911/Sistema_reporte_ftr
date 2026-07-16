<script setup lang="ts">
defineProps<{
  show: boolean
  message?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000" @click.self="$emit('close')">
      <div class="bg-white rounded-xl p-8 max-w-sm w-90% flex flex-col gap-4 items-center shadow-2xl">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p class="m-0 text-text font-medium text-center">{{ message ?? 'Cargando...' }}</p>
      </div>
    </div>
  </Teleport>
</template>