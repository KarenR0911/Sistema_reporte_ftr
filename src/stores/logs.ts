import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { RegistroLog } from '@/types'
import { getAll, putItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const useLogsStore = defineStore('logs', () => {
  const list = ref<RegistroLog[]>([])
  const loaded = ref(false)

  async function refresh() {
    try {
      const sb = getSupabase()
      const { data } = await withTimeout(
        sb.from('registro_logs').select('*').order('created_at', { ascending: false }),
      )
      if (!data) return

      for (const row of data) {
        await putItem('logs', { ...row, status_sync: 'synced' as const })
      }

      const synced = data.map((r) => ({ ...r, status_sync: 'synced' as const })) as RegistroLog[]
      list.value = synced
    } catch {
      // fallo silencioso en background
    }
  }

  async function load() {
    try {
      loaded.value = false
      list.value = (await getAll<RegistroLog>('logs')).sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )
      loaded.value = true

      if (navigator.onLine) {
        refresh()
      }
    } catch (err) {
      console.error('logsStore.load error:', err)
      loaded.value = true
    }
  }

  return { list, loaded, load, refresh }
})