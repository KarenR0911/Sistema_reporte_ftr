import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Usuario, RolUsuario } from '@/types'
import { getAll } from '@/db'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Usuario | null>(null)
  const usuarios = ref<Usuario[]>([])

  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed<RolUsuario | null>(() => currentUser.value?.rol ?? null)

  async function loadUsuarios() {
    usuarios.value = await getAll<Usuario>('usuarios')
  }

  async function login(email: string, password: string): Promise<boolean> {
    await loadUsuarios()
    const localUser = usuarios.value.find(
      (u) => `${u.cedula}@ftr.app` === email && u.password === password && u.activo,
    )
    if (localUser) {
      currentUser.value = localUser
      localStorage.setItem('auth_user', JSON.stringify(localUser))
      return true
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (data.user) {
        const cedula = data.user.user_metadata?.cedula ?? email.split('@')[0]
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('cedula', cedula)
          .single()
        if (perfil) {
          const user: Usuario = {
            id: perfil.id,
            cedula: perfil.cedula,
            nombre: perfil.nombre,
            rol: perfil.rol as RolUsuario,
            password: '',
            activo: perfil.activo,
          }
          currentUser.value = user
          localStorage.setItem('auth_user', JSON.stringify(user))
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    currentUser.value = null
    localStorage.removeItem('auth_user')
  }

  function restoreSession() {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem('auth_user')
      }
    }
  }

  return { currentUser, usuarios, isAuthenticated, userRole, login, logout, loadUsuarios, restoreSession }
})
