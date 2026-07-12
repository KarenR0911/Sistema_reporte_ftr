<script setup lang="ts">
defineProps<{
  label?: string
  modelValue: string
  type?: string
  placeholder?: string
  required?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-semibold text-text">
      {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <input
      :type="type ?? 'text'"
      class="font-sans px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
      :placeholder="placeholder"
      :value="modelValue"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
