<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string }[]
  rows: Record<string, unknown>[]
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" class="text-left px-4 py-3 bg-bg text-text font-bold border-b-2 border-border-light whitespace-nowrap">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="text-center text-text-secondary py-8 italic">No hay registros</td>
        </tr>
        <tr v-for="(row, idx) in rows" :key="idx" class="hover:bg-bg">
          <td v-for="col in columns" :key="col.key" class="px-4 py-2.5 border-b border-surface">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
