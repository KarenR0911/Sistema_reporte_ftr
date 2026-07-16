import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])

  async function load() {
    if (navigator.onLine) {
      const sb = getSupabase()
      try {
        const { data, error } = await sb.from('misiones').select('*').order('created_at', { ascending: false })
        if (!error && data) {
          list.value = data as Mision[]
          for (const item of data) {
            await putItem('misiones', { ...item, status_sync: 'synced' })
          }
          return
        }
      } catch { /* fallback a cache */ }
    }
    list.value = await getAll<Mision>('misiones')
  }

  async function create(mision: Mision) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').insert(mision)
    if (error) throw error
    const saved = { ...mision, status_sync: 'synced' as const }
    list.value.push(saved)
    await putItem('misiones', saved)
  }

  async function update(mision: Mision) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').update(mision).eq('id', mision.id)
    if (error) throw error
    const saved = { ...mision, status_sync: 'synced' as const }
    const idx = list.value.findIndex((m) => m.id === mision.id)
    if (idx !== -1) list.value[idx] = saved
    await putItem('misiones', saved)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((m) => m.id !== id)
    await deleteItem('misiones', id)
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, load, create, update, remove, getById }
})
