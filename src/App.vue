<script setup lang="ts">
import { onMounted } from 'vue'
import { useSync } from '@/composables/useSync'
import { useAuthStore } from '@/stores/auth'
import { useLoadingStore } from '@/stores/loading'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import LoadingDialog from '@/components/ui/LoadingDialog.vue'

const auth = useAuthStore()
const loading = useLoadingStore()
useSync()

onMounted(() => {
  auth.restoreSession()
})
</script>

<template>
  <RouterView />
  <ToastContainer />
  <LoadingDialog :show="loading.isVisible" :message="loading.message" @close="loading.hide" />
</template>
