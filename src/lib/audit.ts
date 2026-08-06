import { getSupabase } from '@/lib/supabase'
import { addItem, putItem } from '@/db'
import { markNeedsSync } from '@/lib/syncTrigger'
import { useAuthStore } from '@/stores/auth'
import { withTimeout } from '@/lib/async'
import type { AccionLog, EntidadLog, RegistroLog, RolUsuario } from '@/types'

/**
 * Registra una acción de auditoría (fire-and-forget).
 * Guarda siempre en IndexedDB ('logs'); si hay conexión intenta
 * persistir en Supabase. Cualquier fallo se silencia.
 */
export async function audit(
  entidad: EntidadLog,
  accion: AccionLog,
  registroId?: string | null,
  resumen?: string | null,
): Promise<void> {
  try {
    const auth = useAuthStore()
    const user = auth.currentUser
    const entry: RegistroLog = {
      id: crypto.randomUUID(),
      usuario_id: user?.id ?? '',
      usuario_cedula: user?.cedula ?? 'desconocido',
      usuario_nombre: user?.nombre ?? 'desconocido',
      usuario_rol: (user?.rol ?? 'personal') as RolUsuario,
      entidad,
      accion,
      registro_id: registroId ?? null,
      resumen: resumen ?? null,
      created_at: new Date().toISOString(),
      status_sync: 'synced',
    }

    if (navigator.onLine && entry.usuario_id) {
      try {
        const sb = getSupabase()
        const { error } = await withTimeout(
          sb.from('registro_logs').insert({
            id: entry.id,
            usuario_id: entry.usuario_id,
            usuario_cedula: entry.usuario_cedula,
            usuario_nombre: entry.usuario_nombre,
            usuario_rol: entry.usuario_rol,
            entidad: entry.entidad,
            accion: entry.accion,
            registro_id: entry.registro_id,
            resumen: entry.resumen,
          } as never),
        )
        if (!error) {
          entry.status_sync = 'synced'
          await putItem('logs', entry)
          return
        }
      } catch {
        // sie falla en línea, colas como pending
      }
    }

    entry.status_sync = 'pending'
    await addItem('logs', entry).catch(() => {})
    markNeedsSync()
  } catch {
    // nunca interferir con el flujo de la app
  }
}