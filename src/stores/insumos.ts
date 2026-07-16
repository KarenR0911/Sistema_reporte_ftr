import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])

  async function load() {
    if (navigator.onLine) {
      const sb = getSupabase()
      try {
        const { data, error } = await sb.from('insumos').select('*')
        if (!error && data) {
          list.value = data as InsumoLlevado[]
          for (const item of data) {
            await putItem('insumos', { ...item, status_sync: 'synced' })
          }
          return
        }
      } catch { /* fallback a cache */ }
    }
    list.value = await getAll<InsumoLlevado>('insumos')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').insert(item)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    list.value.push(saved)
    await putItem('insumos', saved)
  }

  async function update(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').update(item).eq('id', item.id)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    const idx = list.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) list.value[idx] = saved
    await putItem('insumos', saved)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((i) => i.id !== id)
    await deleteItem('insumos', id)
  }

  return { list, load, getByMision, create, update, remove }
})
