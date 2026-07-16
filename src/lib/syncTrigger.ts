import { ref } from 'vue'

const needsSyncCount = ref(0)

export function markNeedsSync() {
  needsSyncCount.value++
}

export function useNeedsSync() {
  return { needsSyncCount }
}
