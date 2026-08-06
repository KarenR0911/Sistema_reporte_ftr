import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mision, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { audit } from '@/lib/audit'
import { withTimeout } from '@/lib/async'

export const useMisionesStore = defineStore('misiones', () => {
  const list = ref<Mision[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('misiones').select('*').order('created_at', { ascending: false }))
      if (!data) return

      const localItems = await getAll<Mision>('misiones')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          await putItem('misiones', { ...row, status_sync: 'synced' as const })
        }
      }

      const serverIds = new Set(data.map((r) => r.id))
      for (const local of localItems) {
        if (local.status_sync !== 'pending' && !serverIds.has(local.id)) {
          await deleteItem('misiones', local.id)
        }
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Mision[]
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
      list.value = await getAll<Mision>('misiones')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('misionesStore.load error:', err)
      loaded.value = true
    }
  }

  async function create(mision: Mision) {
    void audit('mision', 'crear', mision.id, `Dirección: ${mision.direccion}, ${mision.municipio} (${mision.estado})`)
    const clone = { ...mision, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const insertPromise = sb.from('misiones').insert({
          id: clone.id,
          direccion: clone.direccion,
          municipio: clone.municipio,
          estado: clone.estado,
          fecha_inicio: clone.fecha_inicio,
          estatus_mision: clone.estatus_mision,
        })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('misiones', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('misiones', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(mision: Mision) {
    void audit('mision', 'actualizar', mision.id, `Dirección: ${mision.direccion}, ${mision.municipio} (${mision.estado}) — ${mision.estatus_mision}`)
    const clone = { ...mision, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const updatePromise = sb.from('misiones').update({
          direccion: clone.direccion,
          municipio: clone.municipio,
          estado: clone.estado,
          fecha_inicio: clone.fecha_inicio,
          estatus_mision: clone.estatus_mision,
        }).eq('id', clone.id)
        const { error } = await withTimeout(updatePromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('misiones', clone)
          const idx = list.value.findIndex((m) => m.id === clone.id)
          if (idx !== -1) list.value[idx] = clone
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await putItem('misiones', clone)
    const idx = list.value.findIndex((m) => m.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    const target = list.value.find((m) => m.id === id)
    void audit('mision', 'eliminar', id, target ? `Dirección: ${target.direccion}, ${target.municipio}` : null)
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('misiones').delete().eq('id', id))
        if (!error) {
          await deleteItem('misiones', id)
          list.value = list.value.filter((m) => m.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('misiones', id)
    await addDeletedId('misiones', id)
    list.value = list.value.filter((m) => m.id !== id)
    markNeedsSync()
  }

  function getById(id: string) {
    return list.value.find((m) => m.id === id)
  }

  return { list, loaded, load, create, update, remove, getById }
})
