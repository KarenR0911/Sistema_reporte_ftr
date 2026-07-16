import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Usuario, RolUsuario, CategoriaVoluntariado } from '@/types'
import { getAll, addItem } from '@/db'
import { getSupabase, getAuthSupabase } from '@/lib/supabase'

const SESSION_KEY = 'auth_session'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Usuario | null>(null)
  const usuarios = ref<Usuario[]>([])
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed<RolUsuario | null>(() => currentUser.value?.rol ?? null)

  async function loadUsuarios() {
    usuarios.value = await getAll<Usuario>('usuarios')
  }

  async function refreshUsuariosFromSupabase() {
    if (!accessToken.value) return
    try {
      const client = getAuthSupabase(accessToken.value)
      const { data } = await client.from('perfiles').select('*')
      if (data) {
        for (const p of data) {
          const user: Usuario = {
            id: p.id,
            cedula: p.cedula,
            nombre: p.nombre,
            email: p.email ?? '',
            rol: p.rol as RolUsuario,
            activo: p.activo,
            categoria_voluntariado: p.categoria_voluntariado as CategoriaVoluntariado | undefined,
            especialidad: p.especialidad ?? '',
            area_voluntariado: p.area_voluntariado ?? '',
          }
          await addItem('usuarios', user).catch(() => {})
        }
        usuarios.value = await getAll<Usuario>('usuarios')
      }
    } catch {
      // fallback silencioso
    }
  }

  async function login(email: string, password: string, recordar = true): Promise<boolean> {
    // 1. Intentar login online con Supabase Auth
    if (navigator.onLine) {
      try {
        const { data, error } = await getSupabase().auth.signInWithPassword({
          email,
          password,
        })
        if (!error && data.session) {
          accessToken.value = data.session.access_token
          const authClient = getAuthSupabase(data.session.access_token)
          const { data: perfil } = await authClient.from('perfiles').select('*').eq('id', data.user.id).maybeSingle()
          if (perfil) {
            const user: Usuario = {
              id: perfil.id,
              cedula: perfil.cedula,
              nombre: perfil.nombre,
              email: perfil.email ?? '',
              rol: perfil.rol as RolUsuario,
              activo: perfil.activo,
              categoria_voluntariado: perfil.categoria_voluntariado as CategoriaVoluntariado | undefined,
              especialidad: perfil.especialidad ?? '',
              area_voluntariado: perfil.area_voluntariado ?? '',
            }
            await addItem('usuarios', user).catch(() => {})
            await refreshUsuariosFromSupabase()
            currentUser.value = user
            if (recordar) {
              localStorage.setItem(SESSION_KEY, JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                user,
              }))
            }
            return true
          }
        }
      } catch {
        // fallback a offline
      }
    }

    // 2. Offline: buscar en IndexedDB
    await loadUsuarios()
    const localUser = usuarios.value.find(
      (u) => u.email === email && u.activo,
    )
    if (localUser) {
      currentUser.value = localUser
      return true
    }

    return false
  }

  async function logout() {
    currentUser.value = null
    accessToken.value = null
    localStorage.removeItem(SESSION_KEY)
    try {
      await getSupabase().auth.signOut()
    } catch {
      // ignore offline
    }
  }

  function restoreSession() {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const session = JSON.parse(stored)
        currentUser.value = session.user
        accessToken.value = session.access_token
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
  }

  return { currentUser, usuarios, accessToken, isAuthenticated, userRole, login, logout, loadUsuarios, restoreSession }
})