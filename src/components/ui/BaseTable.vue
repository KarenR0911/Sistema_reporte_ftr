<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string }[]
  rows: Record<string, unknown>[]
}>()
</script>

<template>
  <div class="table-wrapper">
    <table class="base-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="empty">No hay registros</td>
        </tr>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
}
.base-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.base-table th {
  text-align: left;
  padding: 12px 16px;
  background: #F5F5F5;
  color: #333;
  font-weight: 700;
  border-bottom: 2px solid #E3E3E3;
  white-space: nowrap;
}
.base-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #F0F0F0;
}
.base-table tbody tr:hover {
  background: #F5F5F5;
}
.empty {
  text-align: center;
  color: #666;
  padding: 32px;
  font-style: italic;
}
</style>
