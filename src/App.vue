<script setup lang="ts">
import { useSync } from '@/composables/useSync'
import { useLoadingStore } from '@/stores/loading'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import LoadingDialog from '@/components/ui/LoadingDialog.vue'

const loading = useLoadingStore()
useSync()
</script>

<template>
  <RouterView />
  <ToastContainer />
  <LoadingDialog :show="loading.isVisible" :message="loading.message" @close="loading.hide" />
</template>