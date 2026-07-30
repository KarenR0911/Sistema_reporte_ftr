import { ref, nextTick, onMounted, onUnmounted } from 'vue'

export function usePrint() {
  const printing = ref(false)

  function onAfterPrint() {
    printing.value = false
  }

  onMounted(() => {
    window.addEventListener('afterprint', onAfterPrint)
  })

  onUnmounted(() => {
    window.removeEventListener('afterprint', onAfterPrint)
  })

  async function printReport() {
    printing.value = true
    await nextTick()
    await new Promise((r) => setTimeout(r, 300))
    window.print()
  }

  return { printing, printReport }
}
