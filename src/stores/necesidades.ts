import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Necesidad, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { withTimeout } from '@/lib/async'

export const useNecesidadesStore = defineStore('necesidades', () => {
  const list = ref<Necesidad[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('necesidades').select('*'))
      if (!data) return

      const localItems = await getAll<Necesidad>('necesidades')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('necesidades', { ...row, status_sync: 'synced' as const })
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Necesidad[]
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
      list.value = await getAll<Necesidad>('necesidades')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('necesidadesStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((n) => n.id_mision === id_mision)
  }

  async function create(item: Necesidad) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('necesidades').insert({
          id: clone.id,
          id_mision: clone.id_mision,
          categoria: clone.categoria,
          descripcion: clone.descripcion,
          cantidad_requerida: clone.cantidad_requerida,
          unidad: clone.unidad,
          observaciones: clone.observaciones,
          prioridad: clone.prioridad,
          estatus: clone.estatus,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('necesidades', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('necesidades', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Necesidad) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const updatePromise = sb.from('necesidades').update({
          categoria: clone.categoria,
          descripcion: clone.descripcion,
          cantidad_requerida: clone.cantidad_requerida,
          unidad: clone.unidad,
          observaciones: clone.observaciones,
          prioridad: clone.prioridad,
          estatus: clone.estatus,
        }).eq('id', clone.id)
        const { error } = await withTimeout(updatePromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('necesidades', clone)
          const idx = list.value.findIndex((n) => n.id === clone.id)
          if (idx !== -1) list.value[idx] = clone
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await putItem('necesidades', clone)
    const idx = list.value.findIndex((n) => n.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('necesidades').delete().eq('id', id))
        if (!error) {
          await deleteItem('necesidades', id)
          list.value = list.value.filter((n) => n.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('necesidades', id)
    await addDeletedId('necesidades', id)
    list.value = list.value.filter((n) => n.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, refresh, getByMision, create, update, remove }
})
