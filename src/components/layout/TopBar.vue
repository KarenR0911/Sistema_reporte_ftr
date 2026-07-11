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
  <header class="topbar">
    <div class="topbar-left">
      <slot name="left" />
    </div>
    <div class="topbar-right">
      <span class="online-indicator" :class="{ offline: !isOnline }">
        <component :is="isOnline ? Wifi : WifiOff" :size="16" />
        {{ isOnline ? 'En línea' : 'Sin conexión' }}
      </span>
      <span class="user-name">{{ auth.currentUser?.nombre }}</span>
      <span class="user-role">{{ auth.currentUser?.rol }}</span>
      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="16" /> Cerrar sesión
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: #00244D;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
}
.online-indicator.offline {
  background: rgba(255, 152, 0, 0.3);
}
.user-name {
  font-weight: 600;
  font-size: 0.9rem;
}
.user-role {
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: capitalize;
}
.logout-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
