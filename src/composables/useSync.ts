import { useOnlineStatus } from './useOnlineStatus'
import { getPending, markAsSynced, getAll, addItem } from '@/db'
import { supabase } from '@/lib/supabase'
import type { StoreName } from '@/db'
import { watch } from 'vue'

const STORES: { store: StoreName; table: string }[] = [
  { store: 'misiones', table: 'misiones' },
  { store: 'transporte', table: 'transporte' },
  { store: 'personal', table: 'personal_mision' },
  { store: 'atendidos', table: 'atendidos' },
  { store: 'necesidades', table: 'necesidades' },
  { store: 'insumos', table: 'insumos' },
]

async function syncStoreToSupabase(store: StoreName, table: string) {
  try {
    const pending = await getPending(store)
    for (const item of pending) {
      const record = { ...item as Record<string, unknown> }
      const { error } = await supabase.from(table).upsert(record, { onConflict: 'id' })
      if (!error) {
        await markAsSynced(store, record.id as string)
      }
    }
  } catch {
    // Silently fail — retry on next online event
  }
}

async function pullFromSupabase(store: StoreName, table: string) {
  try {
    const { data } = await supabase.from(table).select('*')
    if (data) {
      const existing = await getAll<Record<string, unknown>>(store)
      const existingIds = new Set(existing.map((r) => r.id as string))
      for (const row of data) {
        if (!existingIds.has(row.id as string)) {
          await addItem(store, row)
        }
      }
    }
  } catch {
    // Silently fail
  }
}

export function useSync() {
  const { isOnline } = useOnlineStatus()

  async function syncAll() {
    if (!navigator.onLine) return
    for (const { store, table } of STORES) {
      await pullFromSupabase(store, table)
      await syncStoreToSupabase(store, table)
    }
  }

  watch(isOnline, (online) => {
    if (online) {
      syncAll()
    }
  })

  return { syncAll }
}
