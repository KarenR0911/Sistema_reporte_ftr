<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  loadingText?: string
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    class="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variant === 'primary' ? 'bg-primary text-white hover:bg-primary-hover' : '',
      variant === 'secondary' ? 'bg-surface text-text hover:bg-border-light' : '',
      variant === 'danger' ? 'bg-danger text-white hover:bg-danger-hover' : '',
      variant === 'ghost' ? 'bg-transparent text-primary hover:bg-primary/8' : '',
      size === 'sm' ? 'px-3.5 py-1.5 text-sm' : '',
      size === 'md' || (!size) ? 'px-5 py-2.5 text-[0.95rem]' : '',
      size === 'lg' ? 'px-7 py-3.5 text-[1.05rem]' : '',
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="flex items-center gap-1.5">
      <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span v-if="loadingText">{{ loadingText }}</span>
      <span v-else>Cargando...</span>
    </span>
    <slot v-else />
  </button>
</template>
