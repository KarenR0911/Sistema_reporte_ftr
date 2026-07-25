<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label?: string
  modelValue: string
  options: { value: string; label: string }[]
  required?: boolean
  error?: string
  name?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-semibold text-text">
      {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <select
      :id="id"
      :name="name"
      class="font-sans px-3.5 py-2.5 border rounded-lg text-sm bg-white transition-colors cursor-pointer focus:outline-none focus:ring-3 focus:ring-primary/10"
      :class="error ? 'border-danger' : 'border-border focus:border-primary'"
      :value="modelValue"
      :required="required"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Seleccionar...</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="text-danger text-xs m-0">{{ error }}</p>
  </div>
</template>
