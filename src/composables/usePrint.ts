import { ref, nextTick, onUnmounted } from 'vue'

export function usePrint() {
  const printing = ref(false)

  async function printReport() {
    printing.value = true
    await nextTick()
    await new Promise((r) => setTimeout(r, 300))
    window.print()
  }

  function onAfterPrint() {
    printing.value = false
  }

  window.addEventListener('afterprint', onAfterPrint)
  window.addEventListener('beforeprint', onAfterPrint)

  onUnmounted(() => {
    window.removeEventListener('afterprint', onAfterPrint)
    window.removeEventListener('beforeprint', onAfterPrint)
  })

  return { printing, printReport }
}
