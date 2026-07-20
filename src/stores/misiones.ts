import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])
  const loaded = ref(false)

  async function refresh() {
    const sb = getSupabase()
    const { data, error } = await withTimeout(sb.from('misiones').select('*').order('created_at', { ascending: false }))
    if (!error && data) {
      for (const row of data) {
        await putItem('misiones', { ...row, status_sync: 'synced' as const })
      }
      list.value = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Mision[]
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<Mision>('misiones')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('misionesStore.load error:', err)
      loaded.value = true
    }
  }

  async function create(mision: Mision) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('misiones').insert(mision))
    if (error) throw error
    await putItem('misiones', { ...mision, status_sync: 'synced' as const })
    list.value.push(mision)
  }

  async function update(mision: Mision) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('misiones').update(mision).eq('id', mision.id))
    if (error) throw error
    await putItem('misiones', { ...mision, status_sync: 'synced' as const })
    const idx = list.value.findIndex((m) => m.id === mision.id)
    if (idx !== -1) list.value[idx] = mision
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('misiones').delete().eq('id', id))
    if (error) throw error
    await deleteItem('misiones', id)
    list.value = list.value.filter((m) => m.id !== id)
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, loaded, load, create, update, remove, getById }
})
