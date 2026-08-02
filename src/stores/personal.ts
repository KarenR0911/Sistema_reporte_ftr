import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PersonalMision, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { withTimeout } from '@/lib/async'

export const usePersonalStore = defineStore('personal', () => {
  const list = ref<PersonalMision[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('personal_mision').select('*'))
      if (!data) return

      const localItems = await getAll<PersonalMision>('personal')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))
      const serverIds = new Set(data.map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('personal', { ...row, status_sync: 'synced' as const })
        }
      }

      for (const local of localItems) {
        if (local.status_sync !== 'pending' && !serverIds.has(local.id)) {
          await deleteItem('personal', local.id)
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as PersonalMision[]
      const pending = localItems.filter((r) => r.status_sync === 'pending')
      const merged = [...synced, ...pending]
      const seen = new Set<string>()
      list.value = merged.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    } catch {
      // fallo silencioso en background
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<PersonalMision>('personal')
      loaded.value = true

      if (navigator.onLine) {
        await refresh()
      }
    } catch (err) {
      console.error('personalStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((p) => p.id_mision === id_mision)
  }

  async function create(item: PersonalMision) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('personal_mision').insert({
          id: clone.id,
          id_mision: clone.id_mision,
          cedula: clone.cedula,
          nombre: clone.nombre,
          categoria_voluntariado: clone.categoria_voluntariado,
          especialidad: clone.especialidad,
          area_voluntariado: clone.area_voluntariado,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('personal', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('personal', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('personal_mision').delete().eq('id', id))
        if (!error) {
          await deleteItem('personal', id)
          list.value = list.value.filter((p) => p.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('personal', id)
    await addDeletedId('personal', id)
    list.value = list.value.filter((p) => p.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, refresh, getByMision, create, remove }
})
