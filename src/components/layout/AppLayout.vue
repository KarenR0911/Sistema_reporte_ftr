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
  <div class="flex min-h-screen">
    <SidebarNav />
    <div class="flex-1 flex flex-col bg-bg">
      <TopBar />
      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
