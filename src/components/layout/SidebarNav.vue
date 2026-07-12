<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { LayoutDashboard, Users, ClipboardList, Rocket, type LucideIcon } from '@lucide/vue'

const auth = useAuthStore()
const route = useRoute()

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
}

const menuItems = computed<NavItem[]>(() => {
  const role = auth.userRole
  const items: NavItem[] = []

  items.push({ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' })

  if (role === 'director' || role === 'administrador' || role === 'coordinador') {
    items.push({ label: 'Misiones', icon: ClipboardList, to: '/misiones' })
    items.push({ label: 'Nueva Misión', icon: Rocket, to: '/misiones/nueva' })
  }

  if (role === 'director' || role === 'administrador') {
    items.push({ label: 'Usuarios', icon: Users, to: '/usuarios' })
  }

  return items
})
</script>

<template>
  <nav class="w-60 h-screen sticky top-0 bg-brand text-white flex flex-col shrink-0">
    <div class="px-6 py-6 border-b border-white/10">
      <h2 class="m-0 text-2xl font-extrabold tracking-wider">FTR</h2>
      <span class="text-xs opacity-70">Sistema de Reporte</span>
    </div>
    <ul class="list-none py-4 m-0">
      <li v-for="item in menuItems" :key="item.label">
        <RouterLink
          :to="item.to"
          class="flex items-center gap-3 px-6 py-3 text-white/80 no-underline text-sm transition-all border-l-3 border-transparent hover:bg-white/8 hover:text-white"
          :class="{
            'bg-white/12 text-white border-l-primary-light':
              route.path === item.to || route.path.startsWith(item.to + '/'),
          }"
        >
          <span class="flex items-center"><component :is="item.icon" :size="20" /></span>
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
