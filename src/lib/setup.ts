import { supabase } from './supabase'
import { addItem, getAll } from '@/db'
import type { Usuario } from '@/types'

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

export async function seedUsuariosIfNeeded() {
  const local = await getAll<Usuario>('usuarios')
  if (local.length > 0) return

  const usuarios: Usuario[] = [
    { id: crypto.randomUUID(), cedula: '0001', nombre: 'Director General', email: '0001@ftr.app', rol: 'director', password: 'admin', activo: true },
    { id: crypto.randomUUID(), cedula: '0002', nombre: 'Administrador', email: '0002@ftr.app', rol: 'administrador', password: 'admin', activo: true },
    { id: crypto.randomUUID(), cedula: '0003', nombre: 'Coordinador Principal', email: '0003@ftr.app', rol: 'coordinador', password: 'admin', activo: true },
    { id: crypto.randomUUID(), cedula: '0004', nombre: 'Voluntario Uno', email: '0004@ftr.app', rol: 'personal', password: 'admin', activo: true },
  ]

  for (const u of usuarios) {
    await addItem('usuarios', u)
  }
}
