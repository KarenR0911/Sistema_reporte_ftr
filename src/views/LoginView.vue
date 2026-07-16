<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { loginSchema } from '@/lib/schemas'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)

const email = ref('')
const password = ref('')
const recordar = ref(true)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})

async function handleLogin() {
  error.value = ''
  fieldErrors.value = {}
  const result = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    for (const issue of result.error.issues) {
      fieldErrors.value[issue.path[0] as string] = issue.message
    }
    return
  }
  loading.value = true
  try {
    const ok = await auth.login(email.value, password.value, recordar.value)
    if (ok) {
      router.push('/dashboard')
    } else {
      error.value = 'Email o contraseña incorrectos'
    }
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
          :error="fieldErrors.email"
          @update:model-value="fieldErrors.email = ''"
        />
        <BaseInput
          v-model="password"
          label="Contraseña"
          type="password"
          placeholder="Ingrese su contraseña"
          required
          :error="fieldErrors.password"
          @update:model-value="fieldErrors.password = ''"
        />
        <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input type="checkbox" v-model="recordar" class="accent-primary w-4 h-4" />
          Recordar sesión
        </label>
        <p v-if="error" class="text-danger text-sm m-0 text-center">{{ error }}</p>
        <BaseButton type="submit" variant="primary" size="lg" :loading="loading">
          Iniciar Sesión
        </BaseButton>
      </form>
    </div>
  </div>
</template>