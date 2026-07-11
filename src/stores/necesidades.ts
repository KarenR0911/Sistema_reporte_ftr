import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Necesidad } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const useNecesidadesStore = defineStore('necesidades', () => {
  const list = ref<Necesidad[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('necesidades').select('*')
        if (data) { list.value = data as Necesidad[]; return }
      }
    } catch { /* fallback */ }
    list.value = await getAll<Necesidad>('necesidades')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((n) => n.id_mision === id_mision)
  }

  async function create(item: Necesidad) {
    const clone = { ...item }
    await addItem('necesidades', clone)
    if (navigator.onLine) {
      try { await supabase.from('necesidades').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(item: Necesidad) {
    const clone = { ...item }
    await putItem('necesidades', clone)
    if (navigator.onLine) {
      try { await supabase.from('necesidades').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((n) => n.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('necesidades', id)
    if (navigator.onLine) {
      try { await supabase.from('necesidades').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((n) => n.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
