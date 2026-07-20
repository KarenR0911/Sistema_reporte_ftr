import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Usuario, RolUsuario, CategoriaVoluntariado } from '@/types'
import { getAll, addItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

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

  async function refreshUsuariosFromSupabase() {
    try {
      const sb = getSupabase()
      const { data } = await sb.from('perfiles').select('*')
      if (data) {
        for (const p of data) {
          await addItem('usuarios', mapPerfilToUser(p)).catch(() => {})
        }
        usuarios.value = await getAll<Usuario>('usuarios')
      }
    } catch {
      // fallback silencioso
    }
  }

  async function login(email: string, password: string, recordar = true): Promise<boolean> {
    if (navigator.onLine) {
      try {
        const sb = getSupabase()
        const { data, error } = await sb.auth.signInWithPassword({ email, password })
        if (!error && data.session) {
          accessToken.value = data.session.access_token
          const { data: perfil } = await sb.from('perfiles').select('*').eq('id', data.user.id).maybeSingle()
          if (perfil) {
            const user = mapPerfilToUser(perfil)
            await addItem('usuarios', user).catch(() => {})
            await refreshUsuariosFromSupabase()
            currentUser.value = user
            if (!recordar) {
              localStorage.removeItem('ftr-auth-session')
            }
            return true
          }
        }
      } catch {
        // fallback a offline
      }
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
  }

  async function restoreSession() {
    const sb = getSupabase()
    const { data: { session } } = await sb.auth.getSession()

    if (session) {
      accessToken.value = session.access_token
      if (!navigator.onLine) {
        const users = await getAll<Usuario>('usuarios')
        currentUser.value = users.find((u) => u.id === session.user.id) ?? null
        return
      }
      try {
        const { data: perfil } = await sb.from('perfiles').select('*').eq('id', session.user.id).maybeSingle()
        if (perfil) {
          currentUser.value = mapPerfilToUser(perfil)
          return
        }
      } catch {
        // fallback a cache
      }
      const users = await getAll<Usuario>('usuarios')
      currentUser.value = users.find((u) => u.id === session.user.id) ?? null
      return
    }

    // Migración: si había sesión guardada con el formato anterior
    const stored = localStorage.getItem('auth_session')
    if (!stored) return
    try {
      const old = JSON.parse(stored)
      const { data, error } = await sb.auth.setSession({
        access_token: old.access_token,
        refresh_token: old.refresh_token,
      })
      if (!error && data.session) {
        accessToken.value = data.session.access_token
        currentUser.value = old.user
        localStorage.removeItem('auth_session')
      }
    } catch {
      localStorage.removeItem('auth_session')
    }
  }

  return { currentUser, usuarios, accessToken, isAuthenticated, userRole, login, logout, loadUsuarios, restoreSession }
})