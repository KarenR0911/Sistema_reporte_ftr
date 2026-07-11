<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    class="base-btn"
    :class="[`btn-${variant ?? 'primary'}`, `btn-${size ?? 'md'}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  font-family: 'Inria Sans', sans-serif;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm { padding: 6px 14px; font-size: 0.85rem; }
.btn-md { padding: 10px 20px; font-size: 0.95rem; }
.btn-lg { padding: 14px 28px; font-size: 1.05rem; }
.btn-primary { background: #145CAD; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #0f4a8f; }
.btn-secondary { background: #F0F0F0; color: #333; }
.btn-secondary:hover:not(:disabled) { background: #E3E3E3; }
.btn-danger { background: #d32f2f; color: #fff; }
.btn-danger:hover:not(:disabled) { background: #b71c1c; }
.btn-ghost { background: transparent; color: #145CAD; }
.btn-ghost:hover:not(:disabled) { background: rgba(20, 92, 173, 0.08); }
</style>
