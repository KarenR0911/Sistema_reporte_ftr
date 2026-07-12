<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/vue'

const toast = useToastStore()

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const bgMap = {
  success: 'bg-status-synced-bg text-status-synced-text border-l-status-synced-text',
  error: 'bg-status-cancelada-bg text-status-cancelada-text border-l-status-cancelada-text',
  info: 'bg-status-activa-bg text-status-activa-text border-l-status-activa-text',
  warning: 'bg-status-pending-bg text-status-pending-text border-l-status-pending-text',
}

const progressMap = {
  success: 'bg-status-synced-text',
  error: 'bg-status-cancelada-text',
  info: 'bg-status-activa-text',
  warning: 'bg-status-pending-text',
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="fixed top-4 right-4 z-9999 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        class="pointer-events-auto rounded-lg shadow-lg border-l-4 overflow-hidden"
        :class="bgMap[t.type]"
      >
        <div class="flex items-start gap-3 px-4 pt-3 pb-2">
          <component :is="iconMap[t.type]" :size="20" class="shrink-0 mt-0.5" />
          <p class="flex-1 text-sm m-0 leading-5">{{ t.message }}</p>
          <button
            class="bg-transparent border-none cursor-pointer p-0.5 opacity-60 hover:opacity-100 transition-opacity shrink-0"
            @click="toast.dismiss(t.id)"
          >
            <X :size="16" />
          </button>
        </div>
        <div class="h-1 bg-black/10">
          <div
            class="h-full rounded-full"
            :class="progressMap[t.type]"
            :style="{ animation: `shrink ${t.duration}ms linear forwards` }"
          />
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style>
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
</style>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
