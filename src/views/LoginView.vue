<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const ok = await auth.login(email.value, password.value)
    if (ok) {
      router.push('/dashboard')
    } else {
      error.value = 'Email o contraseña incorrectos'
    }
  } catch {
    error.value = 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-primary">
    <div class="bg-white rounded-2xl p-12 w-full max-w-100 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-extrabold text-brand m-0 tracking-widest">FTR</h1>
        <p class="text-text-secondary mt-2 text-sm">Sistema de Reporte<br>por Zonas</p>
      </div>
      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="correo@ejemplo.com"
          required
        />
        <BaseInput
          v-model="password"
          label="Contraseña"
          type="password"
          placeholder="Ingrese su contraseña"
          required
        />
        <p v-if="error" class="text-danger text-sm m-0 text-center">{{ error }}</p>
        <BaseButton type="submit" variant="primary" size="lg" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </BaseButton>
      </form>
    </div>
  </div>
</template>
