import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision } from '@/types'
import { getSupabase } from '@/lib/supabase'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])
  const loaded = ref(false)

  async function load() {
    loaded.value = false
    const sb = getSupabase()
    const { data, error } = await sb.from('misiones').select('*').order('created_at', { ascending: false })
    if (error) throw error
    list.value = data as Mision[]
    loaded.value = true
  }

  async function create(mision: Mision) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').insert(mision)
    if (error) throw error
    list.value.push(mision)
  }

  async function update(mision: Mision) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').update(mision).eq('id', mision.id)
    if (error) throw error
    const idx = list.value.findIndex((m) => m.id === mision.id)
    if (idx !== -1) list.value[idx] = mision
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('misiones').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((m) => m.id !== id)
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, loaded, load, create, update, remove, getById }
})