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
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <h1>FTR</h1>
        <p>Sistema de Reporte<br>por Zonas</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
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
        <p v-if="error" class="error-msg">{{ error }}</p>
        <BaseButton type="submit" variant="primary" size="lg" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00244D 0%, #145CAD 100%);
  font-family: 'Inria Sans', sans-serif;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.brand {
  text-align: center;
  margin-bottom: 32px;
}
.brand h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #00244D;
  margin: 0;
  letter-spacing: 4px;
}
.brand p {
  color: #666;
  margin: 8px 0 0;
  font-size: 0.9rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.error-msg {
  color: #d32f2f;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}
</style>
