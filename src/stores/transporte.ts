import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte } from '@/types'
import { getSupabase } from '@/lib/supabase'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])
  const loaded = ref(false)

  async function load() {
    loaded.value = false
    const sb = getSupabase()
    const { data, error } = await sb.from('transporte').select('*')
    if (error) throw error
    list.value = data as Transporte[]
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').insert(item)
    if (error) throw error
    list.value.push(item)
  }

  async function update(item: Transporte) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').update(item).eq('id', item.id)
    if (error) throw error
    const idx = list.value.findIndex((t) => t.id === item.id)
    if (idx !== -1) list.value[idx] = item
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('transporte').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((t) => t.id !== id)
  }

  return { list, loaded, load, getByMision, create, update, remove }
})