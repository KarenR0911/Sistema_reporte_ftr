import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SalidaInsumo } from '@/types'
import { getSupabase } from '@/lib/supabase'

export const useSalidasInsumosStore = defineStore('salidasInsumos', () => {
  const list = ref<SalidaInsumo[]>([])
  const loaded = ref(false)

  async function load() {
    loaded.value = false
    const sb = getSupabase()
    const { data, error } = await sb.from('salidas_insumos').select('*')
    if (error) throw error
    list.value = data as SalidaInsumo[]
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((s) => s.id_mision === id_mision)
  }

  async function create(item: SalidaInsumo) {
    const sb = getSupabase()
    const { error } = await sb.from('salidas_insumos').insert(item)
    if (error) throw error
    list.value.push(item)
  }

  async function remove(id: string) {
    const sb = getSupabase()
    const { error } = await sb.from('salidas_insumos').delete().eq('id', id)
    if (error) throw error
    list.value = list.value.filter((s) => s.id !== id)
  }

  return { list, loaded, load, getByMision, create, remove }
})
