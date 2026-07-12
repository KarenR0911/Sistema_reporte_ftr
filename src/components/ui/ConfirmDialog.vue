<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps<{
  show: boolean
  title?: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000"
      @click.self="emit('cancel')"
    >
      <div class="bg-white rounded-xl p-8 max-w-110 w-90% flex flex-col gap-4">
        <h2 class="m-0 text-brand text-xl">{{ title ?? 'Confirmar acción' }}</h2>
        <p class="m-0">{{ message }}</p>
        <p v-if="description" class="text-sm text-text-secondary m-0">{{ description }}</p>
        <div class="flex gap-2 justify-end mt-2">
          <BaseButton :variant="variant ?? 'danger'" @click="emit('confirm')">
            {{ confirmText ?? 'Eliminar' }}
          </BaseButton>
          <BaseButton variant="ghost" @click="emit('cancel')">
            {{ cancelText ?? 'Cancelar' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
