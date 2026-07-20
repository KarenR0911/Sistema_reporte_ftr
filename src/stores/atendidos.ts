import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Atendido, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'

export const useAtendidosStore = defineStore('atendidos', () => {
  const list = ref<Atendido[]>([])
  const loaded = ref(false)

  async function load() {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { data } = await sb.from('atendidos').select('*')
        if (data) {
          const localItems = await getAll<Atendido>('atendidos')
          const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

          for (const row of data) {
            if (!pendingIds.has(row.id)) {
              await putItem('atendidos', { ...row, status_sync: 'synced' as const })
            }
          }

          const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as Atendido[]
          const pending = localItems.filter((r) => r.status_sync === 'pending')
          const merged = [...synced, ...pending]
          const seen = new Set<string>()
          list.value = merged.filter((item) => {
            if (seen.has(item.id)) return false
            seen.add(item.id)
            return true
          })
          loaded.value = true
          return
        }
      } catch {
        // fall through to IndexedDB
      }
    }

    list.value = await getAll<Atendido>('atendidos')
    loaded.value = true
  }

  function getByMision(id_mision: string) {
    return list.value.filter((a) => a.id_mision === id_mision)
  }

  async function create(item: Atendido) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      const sb = getSupabase()
      const { error } = await sb.from('atendidos').insert({
        id: clone.id,
        id_mision: clone.id_mision,
        cedula_personal: clone.cedula_personal,
        cedula_atendido: clone.cedula_atendido,
        nombre_atendido: clone.nombre_atendido,
        telefono_contacto: clone.telefono_contacto,
        fecha_hora_atencion: clone.fecha_hora_atencion,
        edad: clone.edad,
        sexo: clone.sexo,
        tipo_atencion: clone.tipo_atencion,
        referido: clone.referido,
        vulnerabilidad: clone.vulnerabilidad,
        notas: clone.notas,
      })
      if (!error) {
        clone.status_sync = 'synced'
        await putItem('atendidos', clone)
        list.value.push(clone)
        return
      }
    }

    await addItem('atendidos', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Atendido) {
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      const sb = getSupabase()
      const { error } = await sb.from('atendidos').update({
        cedula_atendido: clone.cedula_atendido,
        nombre_atendido: clone.nombre_atendido,
        telefono_contacto: clone.telefono_contacto,
        edad: clone.edad,
        sexo: clone.sexo,
        tipo_atencion: clone.tipo_atencion,
        referido: clone.referido,
        vulnerabilidad: clone.vulnerabilidad,
        notas: clone.notas,
      }).eq('id', clone.id)
      if (!error) {
        clone.status_sync = 'synced'
        await putItem('atendidos', clone)
        const idx = list.value.findIndex((a) => a.id === clone.id)
        if (idx !== -1) list.value[idx] = clone
        return
      }
    }

    await putItem('atendidos', clone)
    const idx = list.value.findIndex((a) => a.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    if (navigator.onLine) {
      const sb = getSupabase()
      const { error } = await sb.from('atendidos').delete().eq('id', id)
      if (!error) {
        await deleteItem('atendidos', id)
        list.value = list.value.filter((a) => a.id !== id)
        return
      }
    }

    await deleteItem('atendidos', id)
    await addDeletedId('atendidos', id)
    list.value = list.value.filter((a) => a.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
