<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ShieldAlert } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-primary p-4">
    <div class="bg-white rounded-2xl p-8 sm:p-12 w-full max-w-100 shadow-2xl text-center">
      <div class="mb-4 flex justify-center">
        <ShieldAlert :size="56" class="text-danger" aria-hidden="true" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-brand m-0">Acceso desautorizado</h1>
      <p class="text-text-secondary mt-3 text-sm">
        Tu cuenta fue desactivada por un administrador.
        <br />
        No puedes acceder al sistema. Contacta al equipo para más información.
      </p>
      <BaseButton variant="primary" size="lg" class="w-full justify-center mt-6" @click="handleLogout">
        Cerrar sesión
      </BaseButton>
    </div>
  </div>
</template>
