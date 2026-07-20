import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Usuario, RolUsuario, CategoriaVoluntariado } from '@/types'
import { getAll, addItem, clearStore } from '@/db'
import { getSupabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/async'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Usuario | null>(null)
  const usuarios = ref<Usuario[]>([])
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed<RolUsuario | null>(() => currentUser.value?.rol ?? null)

  function mapPerfilToUser(p: Record<string, unknown>): Usuario {
    return {
      id: p.id as string,
      cedula: p.cedula as string,
      nombre: p.nombre as string,
      email: (p.email as string) || `${p.cedula}@ftr.app`,
      rol: p.rol as RolUsuario,
      activo: (p.activo as boolean) ?? true,
      categoria_voluntariado: p.categoria_voluntariado as CategoriaVoluntariado | undefined,
      especialidad: (p.especialidad as string) ?? '',
      area_voluntariado: (p.area_voluntariado as string) ?? '',
    }
  }

  async function loadUsuarios() {
    usuarios.value = await getAll<Usuario>('usuarios')
  }

  async function login(email: string, password: string): Promise<boolean> {
    if (!navigator.onLine) return false

    try {
      const sb = getSupabase()
      const { data, error } = await withTimeout(sb.auth.signInWithPassword({ email, password }), 3000)
      if (!error && data.session) {
        accessToken.value = data.session.access_token
        const { data: perfil } = await withTimeout(sb.from('perfiles').select('*').eq('id', data.user.id).maybeSingle(), 3000)
        if (perfil) {
          const user = mapPerfilToUser(perfil)
          await addItem('usuarios', user).catch(() => {})
          currentUser.value = user
          return true
        }
      }
    } catch {
      // fallback a offline
    }
    return false
  }

  async function logout() {
    currentUser.value = null
    accessToken.value = null
    try {
      await getSupabase().auth.signOut()
    } catch {
      // ignore offline
    }
    // Limpiar cache offline para que restoreSession no re-autentique
    await clearStore('usuarios')
  }

  async function restoreSession() {
    // Siempre cargar de IndexedDB primero (instantáneo)
    const users = await getAll<Usuario>('usuarios')
    const cached = users[0] ?? null

    if (!navigator.onLine) {
      currentUser.value = cached
      return
    }

    // Intentar refrescar desde Supabase (con timeout corto)
    try {
      const sb = getSupabase()
      const { data: { session } } = await withTimeout(sb.auth.getSession(), 3000)

      if (session) {
        accessToken.value = session.access_token
        const { data: perfil } = await withTimeout(sb.from('perfiles').select('*').eq('id', session.user.id).maybeSingle(), 3000)
        if (perfil) {
          const user = mapPerfilToUser(perfil)
          await addItem('usuarios', user).catch(() => {})
          currentUser.value = user
          return
        }
      }
    } catch {
      // timeout o error de red — usar cache
    }

    currentUser.value = cached

    // Migración: sesión guardada con formato anterior
    const stored = localStorage.getItem('auth_session')
    if (!stored || currentUser.value) return
    try {
      const old = JSON.parse(stored)
      const sb = getSupabase()
      const { data, error } = await withTimeout(sb.auth.setSession({
        access_token: old.access_token,
        refresh_token: old.refresh_token,
      }), 3000)
      if (!error && data.session) {
        accessToken.value = data.session.access_token
        const user = old.user as Usuario
        await addItem('usuarios', user).catch(() => {})
        currentUser.value = user
        localStorage.removeItem('auth_session')
      }
    } catch {
      localStorage.removeItem('auth_session')
    }
  }

  return { currentUser, usuarios, accessToken, isAuthenticated, userRole, login, logout, loadUsuarios, restoreSession }
})
