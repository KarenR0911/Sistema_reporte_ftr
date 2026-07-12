<script setup lang="ts">
defineProps<{
  title?: string
  padding?: string
}>()
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border-light"
    :style="padding ? { padding } : { padding: '24px' }"
  >
    <div v-if="title" class="mb-4 pb-3 border-b border-surface">
      <h3 class="m-0 text-lg text-brand font-bold">{{ title }}</h3>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
