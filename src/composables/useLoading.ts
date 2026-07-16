import { useLoadingStore } from '@/stores/loading'

export function useLoading() {
  const loading = useLoadingStore()
  async function withLoading<T>(fn: () => Promise<T>, message?: string): Promise<T | undefined> {
    loading.show(message)
    try {
      return await fn()
    } finally {
      loading.hide()
    }
  }
  return { loading, withLoading }
}
