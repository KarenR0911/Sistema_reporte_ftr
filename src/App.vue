<script setup lang="ts">
import { onMounted } from 'vue'
import { useSync } from '@/composables/useSync'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
useSync()

onMounted(() => {
  auth.restoreSession()
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
