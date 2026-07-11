<script setup lang="ts">
import { onMounted } from 'vue'
import { useSync } from '@/composables/useSync'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
useSync()

onMounted(() => {
  auth.restoreSession()
})
</script>

<template>
  <RouterView />
</template>
