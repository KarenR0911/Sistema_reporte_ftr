<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
}

const menuItems = computed<NavItem[]>(() => {
  const role = auth.userRole
  const items: NavItem[] = []
  if (role === 'director') {
    items.push(
      { label: 'Dashboard', icon: '📊', to: '/director' },
      { label: 'Usuarios', icon: '👥', to: '/director#usuarios' },
      { label: 'Reportes', icon: '📋', to: '/director#reportes' },
    )
  } else if (role === 'administrador') {
    items.push(
      { label: 'Dashboard', icon: '📊', to: '/admin' },
      { label: 'Reportes', icon: '📋', to: '/admin' },
    )
  } else if (role === 'coordinador') {
    items.push(
      { label: 'Dashboard', icon: '📊', to: '/coordinador' },
      { label: 'Nueva Misión', icon: '🚀', to: '/coordinador/nueva-mision' },
    )
  } else if (role === 'personal') {
    items.push(
      { label: 'Dashboard', icon: '📊', to: '/personal' },
    )
  }
  return items
})
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-brand">
      <h2>FTR</h2>
      <span>Sistema de Reporte</span>
    </div>
    <ul class="nav-list">
      <li v-for="item in menuItems" :key="item.label">
        <a
          v-if="item.to.includes('#')"
          :href="item.to"
          class="nav-link"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </a>
        <RouterLink
          v-else
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  position: sticky;
  top: 0;
  background: #00244D;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-brand {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.sidebar-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 2px;
}
.sidebar-brand span {
  font-size: 0.75rem;
  opacity: 0.7;
}
.nav-list {
  list-style: none;
  padding: 16px 0;
  margin: 0;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.nav-link.active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-left-color: #1FAAE1;
}
.nav-icon {
  font-size: 1.1rem;
}
</style>
