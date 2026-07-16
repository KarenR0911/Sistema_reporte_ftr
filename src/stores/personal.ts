import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])

  async function load() {
    if (navigator.onLine) {
      const sb = getSupabase()
      try {
        const { data, error } = await sb.from('personal_mision').select('*')
        if (!error && data) {
          list.value = data as PersonalMision[]
          for (const item of data) {
            await putItem('personal', { ...item, status_sync: 'synced' })
          }
          return
        }
      } catch { /* fallback a cache */ }
    }
    list.value = await getAll<PersonalMision>('personal')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const sb = getSupabase()
    const { error } = await sb.from('personal_mision').insert(item)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    list.value.push(saved)
    await putItem('personal', saved)
  }

  async function update(item: PersonalMision) {
    const sb = getSupabase()
    const { error } = await sb.from('personal_mision').update(item).eq('id', item.id)
    if (error) throw error
    const saved = { ...item, status_sync: 'synced' as const }
    const idx = list.value.findIndex((p) => p.id === item.id)
    if (idx !== -1) list.value[idx] = saved
    await putItem('personal', saved)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('personal_mision').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((p) => p.id !== id)
    await deleteItem('personal', id)
  }

  return { list, load, getByMision, create, update, remove }
})
