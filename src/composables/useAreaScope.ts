import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAtendidosStore } from '@/stores/atendidos'
import { usePersonalStore } from '@/stores/personal'
import { useMisionesStore } from '@/stores/misiones'
import { useNecesidadesStore } from '@/stores/necesidades'
import { mapAreaToRegistro } from '@/lib/area'
import type { AreaRegistro } from '@/types'

export function useAreaScope() {
  const auth = useAuthStore()
  const atendidosStore = useAtendidosStore()
  const personalStore = usePersonalStore()
  const misionesStore = useMisionesStore()
  const necesidadesStore = useNecesidadesStore()

  const role = computed(() => auth.userRole)
  const esAdmin = computed(() => role.value === 'director' || role.value === 'administrador')

  const scopeArea = computed<AreaRegistro | null>(() => {
    if (esAdmin.value) return null
    return mapAreaToRegistro(auth.currentUser?.area_voluntariado)
  })

  const scopedAtendidos = computed(() => {
    const list = atendidosStore.list
    if (!scopeArea.value) return list
    return list.filter((a) => a.area_registro === scopeArea.value)
  })

  const scopedPersonal = computed(() => {
    const list = personalStore.list
    if (!scopeArea.value) return list
    return list.filter((p) => mapAreaToRegistro(p.area_voluntariado) === scopeArea.value)
  })

  const scopedMisiones = computed(() => {
    const list = misionesStore.list
    if (!scopeArea.value) return list
    const areaIds = new Set<string>()
    for (const a of scopedAtendidos.value) areaIds.add(a.id_mision)
    for (const p of scopedPersonal.value) areaIds.add(p.id_mision)
    return list.filter((m) => areaIds.has(m.id))
  })

  const scopedNecesidades = computed(() => {
    const list = necesidadesStore.list
    if (!scopeArea.value) return list
    const visIds = new Set(scopedMisiones.value.map((m) => m.id))
    return list.filter((n) => visIds.has(n.id_mision))
  })

  return { scopeArea, scopedAtendidos, scopedPersonal, scopedMisiones, scopedNecesidades }
}
