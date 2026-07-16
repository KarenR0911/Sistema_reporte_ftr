import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Atendido } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { markNeedsSync } from '@/lib/syncTrigger'

export const useAtendidosStore = defineStore('atendidos', () => {
  const list = ref<Atendido[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<Atendido>('atendidos')
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((a) => a.id_mision === id_mision)
  }

  async function create(item: Atendido) {
    const clone = { ...item, status_sync: 'pending' as const }
    await addItem('atendidos', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Atendido) {
    const clone = { ...item, status_sync: 'pending' as const }
    await putItem('atendidos', clone)
    const idx = list.value.findIndex((a) => a.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    await deleteItem('atendidos', id)
    await addDeletedId('atendidos', id)
    list.value = list.value.filter((a) => a.id !== id)
    markNeedsSync()
  }

  return { list, load, getByMision, create, update, remove }
})
