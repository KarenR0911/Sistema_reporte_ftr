import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { markNeedsSync } from '@/lib/syncTrigger'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<InsumoLlevado>('insumos')
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const clone = { ...item, status_sync: 'pending' as const }
    await addItem('insumos', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: InsumoLlevado) {
    const clone = { ...item, status_sync: 'pending' as const }
    await putItem('insumos', clone)
    const idx = list.value.findIndex((i) => i.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    await deleteItem('insumos', id)
    await addDeletedId('insumos', id)
    list.value = list.value.filter((i) => i.id !== id)
    markNeedsSync()
  }

  return { list, load, getByMision, create, update, remove }
})
