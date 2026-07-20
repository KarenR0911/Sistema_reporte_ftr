import { ref } from 'vue'

const isOnline = ref(navigator.onLine)

function syncState() {
  isOnline.value = navigator.onLine
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
  window.addEventListener('pageshow', syncState)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncState()
  })
  setTimeout(syncState, 100)
  requestAnimationFrame(syncState)
  setInterval(syncState, 3000)
}

export function useOnlineStatus() {
  return { isOnline }
}
