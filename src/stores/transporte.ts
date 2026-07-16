import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])

  async function load() {
    if (navigator.onLine) {
      const sb = getSupabase()
      try {
        const { data, error } = await sb.from('transporte').select('*')
        if (!error && data) {
          list.value = data as Transporte[]
          for (const item of data) {
            await putItem('transporte', { ...item, status_sync: 'synced' })
          }
          return
        }
      } catch { /* fallback a cache */ }
    }
    list.value = await getAll<Transporte>('transporte')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').insert(item)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    list.value.push(saved)
    await putItem('transporte', saved)
  }

  async function update(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').update(item).eq('id', item.id)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    const idx = list.value.findIndex((t) => t.id === item.id)
    if (idx !== -1) list.value[idx] = saved
    await putItem('transporte', saved)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((t) => t.id !== id)
    await deleteItem('transporte', id)
  }

  return { list, load, getByMision, create, update, remove }
})
