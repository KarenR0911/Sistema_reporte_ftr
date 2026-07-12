import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Usuario, RolUsuario, CategoriaVoluntariado } from '@/types'
import { getAll, addItem } from '@/db'
import { getSupabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Usuario | null>(null)
  const usuarios = ref<Usuario[]>([])

  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed<RolUsuario | null>(() => currentUser.value?.rol ?? null)

  async function loadUsuarios() {
    usuarios.value = await getAll<Usuario>('usuarios')
    if (navigator.onLine && usuarios.value.length === 0) {
      await refreshUsuariosFromSupabase()
    }
  }

  async function refreshUsuariosFromSupabase() {
    try {
      const { data } = await getSupabase().from('perfiles').select('*')
      if (data) {
        for (const p of data) {
          const user: Usuario = {
            id: p.id,
            cedula: p.cedula,
            nombre: p.nombre,
            email: p.email ?? '',
            rol: p.rol as RolUsuario,
            password: p.password ?? '',
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
    // 1. Buscar en IndexedDB (offline-first)
    await loadUsuarios()
    const localUser = usuarios.value.find(
      (u) => u.email === email && u.password === password && u.activo,
    )
    if (localUser) {
      currentUser.value = localUser
      if (recordar) localStorage.setItem('auth_user', JSON.stringify(localUser))
      return true
    }

    // 2. Buscar en perfiles de Supabase (online)
    if (navigator.onLine) {
      try {
        const { data, error } = await getSupabase()
          .from('perfiles')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .eq('activo', true)
          .maybeSingle()

        if (!error && data) {
          const user: Usuario = {
            id: data.id,
            cedula: data.cedula,
            nombre: data.nombre,
            email: data.email ?? '',
            rol: data.rol as RolUsuario,
            password: data.password ?? '',
            activo: data.activo,
            categoria_voluntariado: data.categoria_voluntariado as CategoriaVoluntariado | undefined,
            especialidad: (data.especialidad as string) ?? '',
            area_voluntariado: (data.area_voluntariado as string) ?? '',
          }
          await addItem('usuarios', user)
          await refreshUsuariosFromSupabase()
          currentUser.value = user
          if (recordar) localStorage.setItem('auth_user', JSON.stringify(user))
          return true
        }
      } catch {
        // fallback silencioso
      }
    }

    return false
  }

  async function logout() {
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
