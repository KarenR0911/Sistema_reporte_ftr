import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Atendido, StatusSync } from '@/types'
import { getAll, addItem, putItem, deleteItem, addDeletedId } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { markNeedsSync } from '@/lib/syncTrigger'
import { audit } from '@/lib/audit'
import { withTimeout } from '@/lib/async'

export const useAtendidosStore = defineStore('atendidos', () => {
  const list = ref<Atendido[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(sb.from('atendidos').select('*'))
      if (!data) return

      const localItems = await getAll<Atendido>('atendidos')
      const pendingIds = new Set(localItems.filter((r) => r.status_sync === 'pending').map((r) => r.id))

      for (const row of data) {
        if (!pendingIds.has(row.id)) {
          const item = {
            ...row,
            vulnerabilidad: typeof row.vulnerabilidad === 'string' ? JSON.parse(row.vulnerabilidad) : row.vulnerabilidad ?? [],
            status_sync: 'synced' as const,
          }
          await putItem('atendidos', item)
        }
      }

      const serverIds = new Set(data.map((r) => r.id))
      for (const local of localItems) {
        if (local.status_sync !== 'pending' && !serverIds.has(local.id)) {
          await deleteItem('atendidos', local.id)
        }
      }

      const synced = data.map((r) => ({
        ...r,
        vulnerabilidad: typeof r.vulnerabilidad === 'string' ? JSON.parse(r.vulnerabilidad) : r.vulnerabilidad ?? [],
        status_sync: 'synced' as const,
      })) as Atendido[]
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
      list.value = await getAll<Atendido>('atendidos')
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('atendidosStore.load error:', err)
      loaded.value = true
    }
  }

  function getByMision(id_mision: string) {
    return list.value.filter((a) => a.id_mision === id_mision)
  }

  async function create(item: Atendido) {
    void audit('atendido', 'crear', item.id, `Nombre: ${item.nombre_atendido}`)
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
          const insertPromise = sb.from('atendidos').insert({
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
            vulnerabilidad: JSON.stringify(clone.vulnerabilidad),
            notas: clone.notas,
            area_registro: clone.area_registro,
            lugar_vivia: clone.lugar_vivia,
            lugar_actual: clone.lugar_actual,
            motivo_atencion: clone.motivo_atencion,
            insumo_entregado: clone.insumo_entregado,
            especie: clone.especie,
            posee_tutor: clone.posee_tutor,
            rescatado: clone.rescatado,
            en_adopcion: clone.en_adopcion,
            diagnostico_tentativo: clone.diagnostico_tentativo,
          })
        const { error } = await withTimeout(insertPromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('atendidos', clone)
          list.value.push(clone)
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await addItem('atendidos', clone)
    list.value.push(clone)
    markNeedsSync()
  }

  async function update(item: Atendido) {
    void audit('atendido', 'actualizar', item.id, `Nombre: ${item.nombre_atendido}`)
    const clone = { ...item, status_sync: 'pending' as StatusSync }

    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const updatePromise = sb.from('atendidos').update({
          cedula_atendido: clone.cedula_atendido,
          nombre_atendido: clone.nombre_atendido,
          telefono_contacto: clone.telefono_contacto,
          edad: clone.edad,
          sexo: clone.sexo,
          tipo_atencion: clone.tipo_atencion,
          referido: clone.referido,
          vulnerabilidad: JSON.stringify(clone.vulnerabilidad),
          notas: clone.notas,
          area_registro: clone.area_registro,
          lugar_vivia: clone.lugar_vivia,
          lugar_actual: clone.lugar_actual,
          motivo_atencion: clone.motivo_atencion,
          insumo_entregado: clone.insumo_entregado,
          especie: clone.especie,
          posee_tutor: clone.posee_tutor,
          rescatado: clone.rescatado,
          en_adopcion: clone.en_adopcion,
          diagnostico_tentativo: clone.diagnostico_tentativo,
        }).eq('id', clone.id)
        const { error } = await withTimeout(updatePromise)
        if (!error) {
          clone.status_sync = 'synced'
          await putItem('atendidos', clone)
          const idx = list.value.findIndex((a) => a.id === clone.id)
          if (idx !== -1) list.value[idx] = clone
          return
        }
      } catch {
        // timeout o error — guardar local como pending
      }
    }

    await putItem('atendidos', clone)
    const idx = list.value.findIndex((a) => a.id === clone.id)
    if (idx !== -1) list.value[idx] = clone
    markNeedsSync()
  }

  async function remove(id: string) {
    const target = list.value.find((a) => a.id === id)
    void audit('atendido', 'eliminar', id, target ? `Nombre: ${target.nombre_atendido}` : null)
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(sb.from('atendidos').delete().eq('id', id))
        if (!error) {
          await deleteItem('atendidos', id)
          list.value = list.value.filter((a) => a.id !== id)
          return
        }
      } catch {
        // timeout — marcar para borrar luego
      }
    }

    await deleteItem('atendidos', id)
    await addDeletedId('atendidos', id)
    list.value = list.value.filter((a) => a.id !== id)
    markNeedsSync()
  }

  return { list, loaded, load, getByMision, create, update, remove }
})
