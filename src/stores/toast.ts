import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = crypto.randomUUID()
    toasts.value.push({ id, type, message, duration })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function success(msg: string) { show(msg, 'success') }
  function error(msg: string) { show(msg, 'error') }
  function info(msg: string) { show(msg, 'info') }
  function warning(msg: string) { show(msg, 'warning') }

  return { toasts, show, dismiss, success, error, info, warning }
})
