<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'
import { useSync } from '@/composables/useSync'

const { syncAll } = useSync()

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

onMounted(() => {
  syncAll()
})
</script>

<template>
  <div class="flex min-h-screen">
    <SidebarNav :open="sidebarOpen" @close="closeSidebar" />
    <div class="flex-1 flex flex-col bg-bg min-w-0">
      <TopBar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 p-4 lg:p-6">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
