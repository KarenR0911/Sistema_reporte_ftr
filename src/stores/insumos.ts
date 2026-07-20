import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])
  const loaded = ref(false)

  async function refresh() {
    const sb = getSupabase()
    const { data, error } = await withTimeout(sb.from('insumos').select('*'))
    if (!error && data) {
      for (const row of data) {
        await putItem('insumos', { ...row, status_sync: 'synced' as const })
      }
      list.value = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as InsumoLlevado[]
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<InsumoLlevado>('insumos')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('insumosStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('insumos').insert(item))
    if (error) throw error
    await putItem('insumos', { ...item, status_sync: 'synced' as const })
    list.value.push(item)
  }

  async function update(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('insumos').update(item).eq('id', item.id))
    if (error) throw error
    await putItem('insumos', { ...item, status_sync: 'synced' as const })
    const idx = list.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) list.value[idx] = item
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('insumos').delete().eq('id', id))
    if (error) throw error
    await deleteItem('insumos', id)
    list.value = list.value.filter((i) => i.id !== id)
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
