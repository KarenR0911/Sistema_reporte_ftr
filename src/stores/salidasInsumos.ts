import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SalidaInsumo, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { withTimeout } from '@/lib/async'

export const useSalidasInsumosStore = defineStore('salidasInsumos', () => {
  const list = ref<SalidaInsumo[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('salidas_insumos').select('*'))
      if (!data) return

      const localItems = await getAll<SalidaInsumo>('salidas')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('salidas', { ...row, status_sync: 'synced' as const })
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as SalidaInsumo[]
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
      list.value = await getAll<SalidaInsumo>('salidas')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('salidasInsumosStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((s) => s.id_mision === id_mision)
  }

  async function create(item: SalidaInsumo) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('salidas_insumos').insert({
          id: clone.id,
          id_mision: clone.id_mision,
          id_insumo: clone.id_insumo,
          cantidad: clone.cantidad,
          motivo: clone.motivo,
          registrado_por: clone.registrado_por,
          created_at: clone.created_at,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('salidas', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('salidas', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('salidas_insumos').delete().eq('id', id))
        if (!error) {
          await deleteItem('salidas', id)
          list.value = list.value.filter((s) => s.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('salidas', id)
    await addDeletedId('salidas', id)
    list.value = list.value.filter((s) => s.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, remove }
})
