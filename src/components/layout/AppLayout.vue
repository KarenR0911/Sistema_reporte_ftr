<script setup lang="ts">
import { onMounted } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'
import { useSync } from '@/composables/useSync'

const { syncAll } = useSync()

onMounted(() => {
  syncAll()
})
</script>

<template>
  <div class="app-shell">
    <SidebarNav />
    <div class="main-area">
      <TopBar />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #F5F5F5;
}
.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
