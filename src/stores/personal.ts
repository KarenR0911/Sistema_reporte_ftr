import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision } from '@/types'
import { getAll, putItem, deleteItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])
  const loaded = ref(false)

  async function refresh() {
    const sb = getSupabase()
    const { data, error } = await withTimeout(sb.from('personal_mision').select('*'))
    if (!error && data) {
      for (const row of data) {
        await putItem('personal', { ...row, status_sync: 'synced' as const })
      }
      list.value = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as PersonalMision[]
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<PersonalMision>('personal')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('personalStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('personal_mision').insert(item))
    if (error) throw error
    await putItem('personal', { ...item, status_sync: 'synced' as const })
    list.value.push(item)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await withTimeout(sb.from('personal_mision').delete().eq('id', id))
    if (error) throw error
    await deleteItem('personal', id)
    list.value = list.value.filter((p) => p.id !== id)
  }

  return { list, loaded, load, getByMision, create, remove }
})
