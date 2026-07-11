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
  <div class="field">
    <label v-if="label" class="field-label">{{ label }}<span v-if="required" class="required">*</span></label>
    <input
      :type="type ?? 'text'"
      class="field-input"
      :placeholder="placeholder"
      :value="modelValue"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.9rem; font-weight: 600; color: #333; }
.required { color: #d32f2f; margin-left: 2px; }
.field-input {
  font-family: 'Inria Sans', sans-serif;
  padding: 10px 14px;
  border: 1px solid #BEBEBE;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #fff;
  transition: border-color 0.2s;
}
.field-input:focus {
  outline: none;
  border-color: #145CAD;
  box-shadow: 0 0 0 3px rgba(20, 92, 173, 0.1);
}
</style>
