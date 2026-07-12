<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useRouter } from 'vue-router'
import { Wifi, WifiOff, LogOut } from '@lucide/vue'

const auth = useAuthStore()
const { isOnline } = useOnlineStatus()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex items-center justify-between px-6 h-15 bg-brand text-white sticky top-0 z-100">
    <div class="topbar-left">
      <slot name="left" />
    </div>
    <div class="flex items-center gap-4">
      <span
        class="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
        :class="isOnline ? 'bg-white/15' : 'bg-orange-400/30'"
      >
        <component :is="isOnline ? Wifi : WifiOff" :size="16" />
        {{ isOnline ? 'En línea' : 'Sin conexión' }}
      </span>
      <span class="font-semibold text-sm">{{ auth.currentUser?.nombre }}</span>
      <span class="text-xs opacity-80 capitalize">{{ auth.currentUser?.rol }}</span>
      <button
        class="bg-transparent border border-white/30 text-white px-3.5 py-1.5 rounded-md text-sm cursor-pointer transition-colors hover:bg-white/10 flex items-center gap-1.5"
        @click="handleLogout"
      >
        <LogOut :size="16" /> Cerrar sesión
      </button>
    </div>
  </header>
</template>
