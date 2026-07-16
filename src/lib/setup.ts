import { getSupabase, getAuthSupabase } from './supabase'
import { addItem, getAll } from '@/db'
import type { Usuario, RolUsuario, CategoriaVoluntariado } from '@/types'

const supabase = getSupabase()

export async function initializeApp() {
  const { error } = await supabase.from('misiones').select('id', { count: 'exact', head: true })
  if (error && error.code === 'PGRST301') {
    console.warn(
      'Supabase tables not found. Please run the migration SQL in your Supabase dashboard:\n' +
      '1. Go to https://supabase.com/dashboard/project/nsuskftwonycndueahqd/sql/new\n' +
      '2. Copy the contents of supabase/migration.sql\n' +
      '3. Paste and run in the SQL Editor\n' +
      '4. Refresh this page',
    )
    return false
  }
  return true
}

export async function seedUsuariosIfNeeded(accessToken?: string | null) {
  const local = await getAll<Usuario>('usuarios')
  if (local.length > 0) return
  if (!navigator.onLine) return

  if (accessToken) {
    try {
      const client = getAuthSupabase(accessToken)
      const { data } = await client.from('perfiles').select('*')
      if (data && data.length > 0) {
        for (const p of data) {
          await addItem('usuarios', {
            id: p.id,
            cedula: p.cedula,
            nombre: p.nombre,
            email: p.email ?? '',
            rol: p.rol as RolUsuario,
            activo: p.activo,
            categoria_voluntariado: p.categoria_voluntariado as CategoriaVoluntariado | undefined,
            especialidad: p.especialidad ?? '',
            area_voluntariado: p.area_voluntariado ?? '',
          })
        }
        return
      }
    } catch {
      // fallback silencioso
    }
  }

  const fallback: Usuario[] = [
    { id: crypto.randomUUID(), cedula: 'V-00000001', nombre: 'Director General', email: '0001@ftr.app', rol: 'director', activo: true },
    { id: crypto.randomUUID(), cedula: 'V-00000002', nombre: 'Administrador', email: '0002@ftr.app', rol: 'administrador', activo: true },
    { id: crypto.randomUUID(), cedula: 'V-00000003', nombre: 'Coordinador Principal', email: '0003@ftr.app', rol: 'coordinador', activo: true },
    { id: crypto.randomUUID(), cedula: 'V-00000004', nombre: 'Voluntario Uno', email: '0004@ftr.app', rol: 'personal', activo: true },
  ]
  for (const u of fallback) {
    await addItem('usuarios', u)
  }
}
