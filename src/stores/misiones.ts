import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('misiones').select('*').order('created_at', { ascending: false })
        if (data) {
          list.value = data as Mision[]
          return
        }
      }
    } catch { /* fallback */ }
    list.value = await getAll<Mision>('misiones')
  }

  async function create(mision: Mision) {
    const clone = { ...mision }
    await addItem('misiones', clone)
    if (navigator.onLine) {
      try { await supabase.from('misiones').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(mision: Mision) {
    const clone = { ...mision }
    await putItem('misiones', clone)
    if (navigator.onLine) {
      try { await supabase.from('misiones').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((m) => m.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('misiones', id)
    if (navigator.onLine) {
      try { await supabase.from('misiones').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((m) => m.id !== id)
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, load, create, update, remove, getById }
})
