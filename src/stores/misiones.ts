import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<Mision>('misiones')
    }
  }

  async function create(mision: Mision) {
    const clone = { ...mision, status_sync: 'pending' as const }
    await addItem('misiones', clone)
    list.value.push(clone)
  }

  async function update(mision: Mision) {
    const clone = { ...mision, status_sync: 'pending' as const }
    await putItem('misiones', clone)
    const idx = list.value.findIndex((m) => m.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('misiones', id)
    await addDeletedId('misiones', id)
    list.value = list.value.filter((m) => m.id !== id)
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, load, create, update, remove, getById }
})
