import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isVisible = ref(false)
  const message = ref('Procesando...')
  const count = ref(0)

  function show(msg?: string) {
    message.value = msg ?? 'Procesando...'
    count.value++
    isVisible.value = true
    document.body.style.overflow = 'hidden'
  }

  function hide() {
    count.value = Math.max(0, count.value - 1)
    if (count.value === 0) {
      isVisible.value = false
      document.body.style.overflow = ''
    }
  }

  function reset() {
    count.value = 0
    isVisible.value = false
    document.body.style.overflow = ''
  }

  return { isVisible, message, show, hide, reset }
})