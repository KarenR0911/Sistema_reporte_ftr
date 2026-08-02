export function parseVuln(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  try {
    const s = String(value)
    return s.startsWith('[') ? JSON.parse(s) as string[] : [s]
  } catch {
    return [String(value)]
  }
}

export const VULNERABILIDAD_LABELS: Record<string, string> = {
  embarazada: 'Embarazada',
  discapacidad: 'Discapacidad',
  adulto_mayor: 'Adulto Mayor',
  menor_no_acompanado: 'Menor no Acompañado',
  enfermedad_cronica: 'Enfermedad Crónica',
  otro: 'Otro',
}

export function labelVuln(v: string): string {
  return VULNERABILIDAD_LABELS[v] ?? v
}
