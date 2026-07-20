<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { loginSchema } from '@/lib/schemas'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useLoading } from '@/composables/useLoading'

const auth = useAuthStore()
const router = useRouter()
const toast = useToastStore()
const { isOnline } = useOnlineStatus()
const { withLoading, saving } = useLoading()

const email = ref('')
const password = ref('')
const error = ref('')
const recordar = ref(localStorage.getItem('recordar_sesion') === 'true')

onMounted(async () => {
  try {
    await auth.restoreSession()
    if (auth.isAuthenticated) {
      router.replace('/dashboard')
      return
    }
  } catch {
    // sin sesión previa
  }

  if (recordar.value) {
    const saved = localStorage.getItem('last_email')
    if (saved) email.value = saved
  }
})

async function handleLogin() {
  const result = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Datos inválidos'
    return
  }

  if (recordar.value) {
    localStorage.setItem('recordar_sesion', 'true')
    localStorage.setItem('last_email', email.value)
  } else {
    localStorage.removeItem('recordar_sesion')
    localStorage.removeItem('last_email')
  }

  error.value = ''
  await withLoading(async () => {
    const ok = await auth.login(email.value, password.value)
    if (ok) {
      toast.success(`Bienvenido, ${auth.currentUser?.nombre ?? ''}`)
      router.replace('/dashboard')
    } else {
      error.value = 'Credenciales inválidas'
    }
  }, 'Iniciando sesión...')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-primary p-4">
    <div class="bg-white rounded-2xl p-8 sm:p-12 w-full max-w-100 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-brand m-0 tracking-widest">FTR</h1>
        <p class="text-text-secondary mt-2 text-sm">Sistema de Reporte<br>por Zonas</p>
      </div>
      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="correo@ejemplo.com"
          required
          autocomplete="email"
        />
        <BaseInput
          v-model="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
        <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input type="checkbox" v-model="recordar" class="accent-primary w-4 h-4" />
          Recordar sesión
        </label>
        <p v-if="error" class="text-danger text-sm m-0 text-center">{{ error }}</p>
        <BaseButton type="submit" variant="primary" size="lg" :loading="saving" class="w-full justify-center">
          {{ isOnline ? 'Iniciar sesión' : 'Ingresar (sin conexión)' }}
        </BaseButton>
      </form>
    </div>
  </div>
</template>
