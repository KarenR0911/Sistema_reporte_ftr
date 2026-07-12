<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useSync } from '@/composables/useSync'
import { useRouter } from 'vue-router'
import { Wifi, WifiOff, LogOut, RefreshCw, CloudOff } from '@lucide/vue'

const auth = useAuthStore()
const { isOnline } = useOnlineStatus()
const { isSyncing, pendingCount } = useSync()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const syncLabel = computed(() => {
  if (isSyncing.value) return 'Sincronizando...'
  if (pendingCount.value > 0) return `${pendingCount.value} pendiente(s)`
  return ''
})
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
      <span
        v-if="isOnline && pendingCount > 0"
        class="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
        :class="isSyncing ? 'bg-blue-400/30' : 'bg-yellow-400/20'"
      >
        <RefreshCw v-if="isSyncing" :size="14" class="animate-spin" />
        <CloudOff v-else :size="14" />
        {{ syncLabel }}
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
