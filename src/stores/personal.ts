import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision } from '@/types'
import { getSupabase } from '@/lib/supabase'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])
  const loaded = ref(false)

  async function load() {
    loaded.value = false
    const sb = getSupabase()
    const { data, error } = await sb.from('personal_mision').select('*')
    if (error) throw error
    list.value = data as PersonalMision[]
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const sb = getSupabase()
    const { error } = await sb.from('personal_mision').insert(item)
    if (error) throw error
    list.value.push(item)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('personal_mision').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((p) => p.id !== id)
  }

  return { list, loaded, load, getByMision, create, remove }
})