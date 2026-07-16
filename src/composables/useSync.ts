import { useOnlineStatus } from './useOnlineStatus'
import { getPending, markAsSynced, putItem, getAll, getDeletedIds, clearDeletedId } from '@/db'
import { getAuthSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNeedsSync } from '@/lib/syncTrigger'
import type { StoreName } from '@/db'
import { ref, watch, onUnmounted } from 'vue'

const STORES: { store: StoreName; table: string }[] = [
  { store: 'misiones', table: 'misiones' },
  { store: 'transporte', table: 'transporte' },
  { store: 'personal', table: 'personal_mision' },
  { store: 'atendidos', table: 'atendidos' },
  { store: 'necesidades', table: 'necesidades' },
  { store: 'insumos', table: 'insumos' },
]

const STORE_TABLE_MAP = new Map(STORES.map((s) => [s.store, s.table]))

function tableForStore(store: string): string {
  return STORE_TABLE_MAP.get(store as StoreName) ?? store
}

const isSyncing = ref(false)
const pendingCount = ref(0)

async function refreshPendingCount() {
  let total = 0
  for (const { store } of STORES) {
    const items = await getPending(store)
    total += items.length
  }
  const deleted = await getDeletedIds()
  total += deleted.length
  pendingCount.value = total
}

async function syncDeletesToSupabase(token: string) {
  const deleted = await getDeletedIds()
  if (deleted.length === 0) return
  const client = getAuthSupabase(token)
  for (const record of deleted) {
    const table = tableForStore(record.store)
    try {
      const { error } = await client.from(table).delete().eq('id', record.id.replace(`${record.store}:`, ''))
      if (!error) {
        await clearDeletedId(record.id)
      }
    } catch {
      // retry next cycle
    }
  }
}

async function syncStoreToSupabase(store: StoreName, table: string, token: string, retries = 3) {
  const client = getAuthSupabase(token)
  const pending = await getPending(store)
  for (const item of pending) {
    const { status_sync: _, ...record } = { ...item as Record<string, unknown> }
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { error } = await client.from(table).upsert(record, { onConflict: 'id' })
        if (!error) {
          await markAsSynced(store, record.id as string)
          await client.from(table).update({ status_sync: 'synced' }).eq('id', record.id as string)
          break
        }
      } catch {
        if (attempt === retries - 1) break
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
}

async function pullFromSupabase(store: StoreName, table: string, token: string) {
  if (!navigator.onLine) return
  try {
    const client = getAuthSupabase(token)
    const [remoteData, localData] = await Promise.all([
      client.from(table).select('*'),
      getAll<Record<string, unknown>>(store),
    ])
    const { data } = remoteData
    if (!data) return
    const localPending = new Set(
      localData.filter((r) => r.status_sync === 'pending').map((r) => r.id as string),
    )
    for (const row of data) {
      if (!localPending.has(row.id as string)) {
        await putItem(store, { ...row, status_sync: 'synced' })
      }
    }
  } catch {
    // Silently fail
  }
}

let watcherInitialized = false
let stopWatcher: (() => void) | null = null

export function useSync() {
  const { isOnline } = useOnlineStatus()
  const auth = useAuthStore()

  async function syncAll() {
    if (!navigator.onLine) return
    const token = auth.accessToken
    if (!token) return
    isSyncing.value = true
    try {
      await syncDeletesToSupabase(token)
      for (const { store, table } of STORES) {
        await pullFromSupabase(store, table, token)
        await syncStoreToSupabase(store, table, token)
      }
      await refreshPendingCount()
    } finally {
      isSyncing.value = false
    }
  }

  if (!watcherInitialized) {
    watcherInitialized = true
    stopWatcher = watch(isOnline, (online) => {
      if (online) {
        syncAll()
      }
    })
    refreshPendingCount()
  }

  const { needsSyncCount } = useNeedsSync()
  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  watch(needsSyncCount, () => {
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      syncAll()
    }, 2000)
  })

  onUnmounted(() => {
    if (stopWatcher) stopWatcher()
    if (syncTimeout) clearTimeout(syncTimeout)
  })

  return { syncAll, isSyncing, pendingCount }
}