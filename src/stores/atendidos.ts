import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Atendido } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const useAtendidosStore = defineStore('atendidos', () => {
  const list = ref<Atendido[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('atendidos').select('*')
        if (data) { list.value = data as Atendido[]; return }
      }
    } catch { /* fallback */ }
    list.value = await getAll<Atendido>('atendidos')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((a) => a.id_mision === id_mision)
  }

  async function create(item: Atendido) {
    const clone = { ...item }
    await addItem('atendidos', clone)
    if (navigator.onLine) {
      try { await supabase.from('atendidos').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(item: Atendido) {
    const clone = { ...item }
    await putItem('atendidos', clone)
    if (navigator.onLine) {
      try { await supabase.from('atendidos').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((a) => a.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('atendidos', id)
    if (navigator.onLine) {
      try { await supabase.from('atendidos').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((a) => a.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
