import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InsumoLlevado, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { withTimeout } from '@/lib/async'

export const useInsumosStore = defineStore('insumos', () => {
  const list = ref<InsumoLlevado[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('insumos').select('*'))
      if (!data) return

      const localItems = await getAll<InsumoLlevado>('insumos')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('insumos', { ...row, status_sync: 'synced' as const })
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as InsumoLlevado[]
      const pending = localItems.filter((r) => r.status_sync === 'pending')
      const merged = [...synced, ...pending]
      const seen = new Set<string>()
      list.value = merged.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    } catch {
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = await getAll<InsumoLlevado>('insumos')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('insumosStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((i) => i.id_mision === id_mision)
  }

  async function create(item: InsumoLlevado) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('insumos').insert({
          id: clone.id,
          id_mision: clone.id_mision,
          categoria: clone.categoria,
          descripcion: clone.descripcion,
          cantidad: clone.cantidad,
          unidad: clone.unidad,
          observaciones: clone.observaciones,
          estatus_cargamento: clone.estatus_cargamento,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('insumos', clone)
          list.value.push(clone)
          return
        }
      } catch {
      }
    }

    await addItem('insumos', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: InsumoLlevado) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const updatePromise = sb.from('insumos').update({
          categoria: clone.categoria,
          descripcion: clone.descripcion,
          cantidad: clone.cantidad,
          unidad: clone.unidad,
          observaciones: clone.observaciones,
          estatus_cargamento: clone.estatus_cargamento,
        }).eq('id', clone.id)
        const { error } = await withTimeout(updatePromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('insumos', clone)
          const idx = list.value.findIndex((i) => i.id === clone.id)
          if (idx !== -1) list.value[idx] = clone
          return
        }
      } catch {
      }
    }

    await putItem('insumos', clone)
    const idx = list.value.findIndex((i) => i.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('insumos').delete().eq('id', id))
        if (!error) {
          await deleteItem('insumos', id)
          list.value = list.value.filter((i) => i.id !== id)
          return
        }
      } catch {
      }
    }

    await deleteItem('insumos', id)
    await addDeletedId('insumos', id)
    list.value = list.value.filter((i) => i.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
