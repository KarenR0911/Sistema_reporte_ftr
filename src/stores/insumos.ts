import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('insumos').select('*')
        if (data) { list.value = data as InsumoLlevado[]; return }
      }
    } catch { /* fallback */ }
    list.value = await getAll<InsumoLlevado>('insumos')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const clone = { ...item }
    await addItem('insumos', clone)
    if (navigator.onLine) {
      try { await supabase.from('insumos').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(item: InsumoLlevado) {
    const clone = { ...item }
    await putItem('insumos', clone)
    if (navigator.onLine) {
      try { await supabase.from('insumos').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((i) => i.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('insumos', id)
    if (navigator.onLine) {
      try { await supabase.from('insumos').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((i) => i.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
