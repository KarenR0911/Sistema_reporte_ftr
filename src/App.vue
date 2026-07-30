<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import LoadingDialog from '@/components/ui/LoadingDialog.vue'

const loading = useLoadingStore()
</script>

<template>
  <RouterView />
  <ToastContainer />
  <LoadingDialog :show="loading.isVisible" :message="loading.message" @close="loading.hide" />
</template>