import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('transporte').select('*')
        if (data) { list.value = data as Transporte[]; return }
      }
    } catch { /* fallback */ }
    list.value = await getAll<Transporte>('transporte')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const clone = { ...item }
    await addItem('transporte', clone)
    if (navigator.onLine) {
      try { await supabase.from('transporte').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(item: Transporte) {
    const clone = { ...item }
    await putItem('transporte', clone)
    if (navigator.onLine) {
      try { await supabase.from('transporte').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((t) => t.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('transporte', id)
    if (navigator.onLine) {
      try { await supabase.from('transporte').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((t) => t.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
