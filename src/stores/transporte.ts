import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await getAll<Transporte>('transporte')
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const clone = { ...item, status_sync: 'pending' as const }
    await addItem('transporte', clone)
    list.value.push(clone)
  }

  async function update(item: Transporte) {
    const clone = { ...item, status_sync: 'pending' as const }
    await putItem('transporte', clone)
    const idx = list.value.findIndex((t) => t.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('transporte', id)
    await addDeletedId('transporte', id)
    list.value = list.value.filter((t) => t.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
