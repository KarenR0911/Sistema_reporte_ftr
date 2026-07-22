import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data, error } = await withTimeout(sb.from('transporte').select('*'))
      if (!error && data) {
        for (const row of data) {
          await putItem('transporte', { ...row, status_sync: 'synced' as const })
        }
        list.value = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Transporte[]
      }
    } catch {
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<Transporte>('transporte')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('transporteStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').insert(item)
    if (error) throw error
    await putItem('transporte', { ...item, status_sync: 'synced' as const })
    list.value.push(item)
  }

  async function update(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').update(item).eq('id', item.id)
    if (error) throw error
    await putItem('transporte', { ...item, status_sync: 'synced' as const })
    const idx = list.value.findIndex((t) => t.id === item.id)
    if (idx !== -1) list.value[idx] = item
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').delete().eq('id', id)
    if (error) throw error
    await deleteItem('transporte', id)
    list.value = list.value.filter((t) => t.id !== id)
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
