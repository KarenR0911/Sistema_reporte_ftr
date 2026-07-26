import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transporte, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { withTimeout } from '@/lib/async'

export const useTransporteStore = defineStore('transporte', () => {
  const list = ref<Transporte[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('transporte').select('*'))
      if (!data) return

      const localItems = await getAll<Transporte>('transporte')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('transporte', { ...row, status_sync: 'synced' as const })
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Transporte[]
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
      list.value = await getAll<Transporte>('transporte')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('transporteStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((t) => t.id_mision === id_mision)
  }

  async function create(item: Transporte) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('transporte').insert({
          id: clone.id,
          id_mision: clone.id_mision,
          tipo_transporte: clone.tipo_transporte,
          numero_placa: clone.numero_placa,
          nombre_conductor: clone.nombre_conductor,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('transporte', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('transporte', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Transporte) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const updatePromise = sb.from('transporte').update({
          tipo_transporte: clone.tipo_transporte,
          numero_placa: clone.numero_placa,
          nombre_conductor: clone.nombre_conductor,
        }).eq('id', clone.id)
        const { error } = await withTimeout(updatePromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('transporte', clone)
          const idx = list.value.findIndex((t) => t.id === clone.id)
          if (idx !== -1) list.value[idx] = clone
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await putItem('transporte', clone)
    const idx = list.value.findIndex((t) => t.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('transporte').delete().eq('id', id))
        if (!error) {
          await deleteItem('transporte', id)
          list.value = list.value.filter((t) => t.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('transporte', id)
    await addDeletedId('transporte', id)
    list.value = list.value.filter((t) => t.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
