<script setup lang="ts">
import { useId } from 'vue'

const props = defineProps<{
  label?: string
  modelValue: string | number | null
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  maxlength?: number
  min?: number | string
  max?: number | string
  name?: string
  autocomplete?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const id = useId()

function handleInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (props.type === 'number') {
    emit('update:modelValue', raw === '' ? '' : Number(raw))
  } else {
    emit('update:modelValue', raw)
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-semibold text-text">
      {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <input
      :id="id"
      :type="type ?? 'text'"
      :name="name"
      :autocomplete="autocomplete"
      class="font-sans px-3.5 py-2.5 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-3 focus:ring-primary/10"
      :class="error ? 'border-danger' : 'border-border focus:border-primary'"
      :placeholder="placeholder"
      :value="modelValue"
      :required="required"
      :maxlength="maxlength"
      :min="min"
      :max="max"
      @input="handleInput"
    />
    <p v-if="error" class="text-danger text-xs m-0">{{ error }}</p>
  </div>
</template>
