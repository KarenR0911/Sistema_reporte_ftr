import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Necesidad } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { markNeedsSync } from '@/lib/syncTrigger'

export const useNecesidadesStore = defineStore('necesidades', () => {
  const list = ref<Necesidad[]>([])
  const loaded = ref(false)

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<Necesidad>('necesidades')
    }
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((n) => n.id_mision === id_mision)
  }

  async function create(item: Necesidad) {
    const clone = { ...item, status_sync: 'pending' as const }
    await addItem('necesidades', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Necesidad) {
    const clone = { ...item, status_sync: 'pending' as const }
    await putItem('necesidades', clone)
    const idx = list.value.findIndex((n) => n.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    await deleteItem('necesidades', id)
    await addDeletedId('necesidades', id)
    list.value = list.value.filter((n) => n.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
