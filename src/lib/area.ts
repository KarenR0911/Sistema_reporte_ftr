import type { AreaRegistro } from '@/types'

export const AREA_LABELS: Record<string, string> = {
  general: 'General',
  medicina_humana: 'Medicina Humana',
  psicologia: 'Psicología',
  veterinaria: 'Veterinaria',
  logistica: 'Logística',
}

export function mapAreaToRegistro(raw: string | undefined | null): AreaRegistro {
  if (!raw) return 'general'
  const lower = raw.toLowerCase().replace(/_/g, ' ')
  if (lower.includes('veterinaria')) return 'veterinaria'
  if (lower.includes('medicina')) return 'medicina_humana'
  if (lower.includes('psicosocial') || lower.includes('psicologia') || lower.includes('psicol') || lower.includes('salud mental')) return 'psicologia'
  return 'general'
}

export function areaLabel(area: AreaRegistro | null | undefined): string {
  return (area && AREA_LABELS[area]) || 'General'
}
