import { ref } from 'vue'
import { useLoadingStore } from '@/stores/loading'

export function useLoading() {
  const loading = useLoadingStore()
  const saving = ref(false)

  async function withLoading<T>(fn: () => Promise<T>, message?: string): Promise<T | undefined> {
    saving.value = true
    loading.show(message)
    try {
      return await fn()
    } finally {
      saving.value = false
      loading.hide()
    }
  }

  return { loading, withLoading, saving }
}
