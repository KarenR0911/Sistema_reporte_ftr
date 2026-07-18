import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado } from '@/types'
import { getSupabase } from '@/lib/supabase'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])
  const loaded = ref(false)

  async function load() {
    loaded.value = false
    const sb = getSupabase()
    const { data, error } = await sb.from('insumos').select('*')
    if (error) throw error
    list.value = data as InsumoLlevado[]
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').insert(item)
    if (error) throw error
    list.value.push(item)
  }

  async function update(item: InsumoLlevado) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').update(item).eq('id', item.id)
    if (error) throw error
    const idx = list.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) list.value[idx] = item
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('insumos').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((i) => i.id !== id)
  }

  return { list, loaded, load, getByMision, create, update, remove }
})