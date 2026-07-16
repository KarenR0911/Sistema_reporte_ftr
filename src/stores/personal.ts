import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { markNeedsSync } from '@/lib/syncTrigger'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<PersonalMision>('personal')
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const clone = { ...item, status_sync: 'pending' as const }
    await addItem('personal', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: PersonalMision) {
    const clone = { ...item, status_sync: 'pending' as const }
    await putItem('personal', clone)
    const idx = list.value.findIndex((p) => p.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    await deleteItem('personal', id)
    await addDeletedId('personal', id)
    list.value = list.value.filter((p) => p.id !== id)
    markNeedsSync()
  }

  return { list, load, getByMision, create, update, remove }
})
