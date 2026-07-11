import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision } from '@/types'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { supabase } from '@/lib/supabase'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])

  async function load() {
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from('personal_mision').select('*')
        if (data) { list.value = data as PersonalMision[]; return }
      }
    } catch { /* fallback */ }
    list.value = await getAll<PersonalMision>('personal')
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const clone = { ...item }
    await addItem('personal', clone)
    if (navigator.onLine) {
      try { await supabase.from('personal_mision').insert(clone).maybeSingle() } catch { /* ignore */ }
    }
    list.value.push(clone)
  }

  async function update(item: PersonalMision) {
    const clone = { ...item }
    await putItem('personal', clone)
    if (navigator.onLine) {
      try { await supabase.from('personal_mision').update(clone).eq('id', clone.id) } catch { /* ignore */ }
    }
    const idx = list.value.findIndex((p) => p.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
  }

  async function remove(id: string) {
    await deleteItem('personal', id)
    if (navigator.onLine) {
      try { await supabase.from('personal_mision').delete().eq('id', id) } catch { /* ignore */ }
    }
    list.value = list.value.filter((p) => p.id !== id)
  }

  return { list, load, getByMision, create, update, remove }
})
