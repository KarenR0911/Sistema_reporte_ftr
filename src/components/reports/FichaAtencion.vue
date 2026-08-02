<script setup lang="ts">
import type { Atendido, Mision, PersonalMision } from '@/types'

const props = defineProps<{
  atendido: Atendido
  mission: Mision | null
  personal: PersonalMision | null
}>()

const area = props.atendido.area_registro || 'general'

const areaLabels: Record<string, string> = {
  general: 'General', medicina_humana: 'Medicina Humana',
  psicologia: 'Psicología', veterinaria: 'Veterinaria', logistica: 'Logística',
}

function labelTipoAtencion(val: string | null): string {
  const labels: Record<string, string> = {
    medica: 'Médica / Primeros Auxilios', psicosocial: 'Apoyo Psicosocial',
    alimento: 'Alimentación / Hidratación', refugio: 'Refugio / Abrigo',
    higiene: 'Kits de Higiene', informacion: 'Orientación',
    traslado: 'Traslado / Evacuación', otro: 'Otro',
  }
  return val ? (labels[val] ?? val) : '—'
}

function labelSexo(val: string | null): string {
  return val === 'masculino' ? 'Masculino' : val === 'femenino' ? 'Femenino' : val === 'otro' ? 'Otro' : '—'
}

function labelVuln(v: string): string {
  const m: Record<string, string> = {
    embarazada: 'Embarazada', discapacidad: 'Discapacidad', adulto_mayor: 'Adulto Mayor',
    menor_no_acompanado: 'Menor no Acompañado', enfermedad_cronica: 'Enfermedad Crónica', otro: 'Otra',
  }
  return m[v] ?? v
}

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="report">
    <div class="report-header">
      <h1 class="report-title">Ficha de {{ area === 'veterinaria' ? 'Registro Veterinario' : 'Atención' }}</h1>
      <p class="report-date">Área: {{ areaLabels[area] || area }} — Generado el {{ new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</p>
    </div>

    <div v-if="mission" class="report-section">
      <h2 class="section-title">Datos de la Misión</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Ubicación</td><td class="info-value">{{ mission.municipio }}, {{ mission.estado }}</td></tr>
          <tr><td class="info-label">Dirección</td><td class="info-value">{{ mission.direccion }}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">{{ area === 'veterinaria' ? 'Datos del Animal' : 'Datos de la Persona Atendida' }}</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Nombre</td><td class="info-value">{{ atendido.nombre_atendido }}</td></tr>
          <tr v-if="area !== 'veterinaria'"><td class="info-label">Cédula</td><td class="info-value">{{ atendido.cedula_atendido || '—' }}</td></tr>
          <tr v-if="area === 'veterinaria'"><td class="info-label">Especie</td><td class="info-value">{{ atendido.especie || '—' }}</td></tr>
          <tr v-if="area !== 'veterinaria'"><td class="info-label">Teléfono</td><td class="info-value">{{ atendido.telefono_contacto || '—' }}</td></tr>
          <tr><td class="info-label">Edad</td><td class="info-value">{{ atendido.edad ?? '—' }}</td></tr>
          <tr><td class="info-label">Sexo</td><td class="info-value">{{ labelSexo(atendido.sexo) }}</td></tr>
          <tr v-if="area === 'veterinaria'">
            <td class="info-label">Posee tutor</td>
            <td class="info-value">{{ atendido.posee_tutor ? 'Sí' : 'No' }}</td>
          </tr>
          <tr v-if="area === 'veterinaria'">
            <td class="info-label">Rescatado</td>
            <td class="info-value">{{ atendido.rescatado ? 'Sí' : 'No' }}</td>
          </tr>
          <tr v-if="area === 'veterinaria'">
            <td class="info-label">En adopción</td>
            <td class="info-value">{{ atendido.en_adopcion ? 'Sí' : 'No' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-section">
      <h2 class="section-title">{{ area === 'veterinaria' ? 'Diagnóstico' : area === 'logistica' ? 'Registro Logístico' : 'Atención Recibida' }}</h2>
      <table class="info-table">
        <tbody>
          <template v-if="area === 'medicina_humana' || area === 'psicologia'">
            <tr><td class="info-label">Motivo de Atención</td><td class="info-value">{{ atendido.motivo_atencion || '—' }}</td></tr>
            <tr><td class="info-label">Lugar donde vivía</td><td class="info-value">{{ atendido.lugar_vivia || '—' }}</td></tr>
            <tr><td class="info-label">Lugar actual</td><td class="info-value">{{ atendido.lugar_actual || '—' }}</td></tr>
          </template>
          <template v-if="area === 'logistica'">
            <tr><td class="info-label">Lugar donde vivía</td><td class="info-value">{{ atendido.lugar_vivia || '—' }}</td></tr>
            <tr><td class="info-label">Lugar actual</td><td class="info-value">{{ atendido.lugar_actual || '—' }}</td></tr>
            <tr><td class="info-label">Insumo Entregado</td><td class="info-value">{{ atendido.insumo_entregado || '—' }}</td></tr>
          </template>
          <template v-if="area === 'veterinaria'">
            <tr><td class="info-label">Diagnóstico Tentativo</td><td class="info-value">{{ atendido.diagnostico_tentativo || '—' }}</td></tr>
          </template>
          <template v-if="area === 'general'">
            <tr><td class="info-label">Tipo de Atención</td><td class="info-value">{{ labelTipoAtencion(atendido.tipo_atencion) }}</td></tr>
            <tr><td class="info-label">Requiere Referencia</td><td class="info-value">{{ atendido.referido ? 'Sí' : 'No' }}</td></tr>
          </template>
          <tr><td class="info-label">Fecha y Hora</td><td class="info-value">{{ formatDateTime(atendido.fecha_hora_atencion) }}</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="area === 'general' && atendido.vulnerabilidad" class="report-section">
      <h2 class="section-title">Vulnerabilidades</h2>
      <div class="flex flex-wrap gap-2 mt-1">
        <span v-for="v in (atendido.vulnerabilidad ?? [])" :key="v" class="vuln-badge">{{ labelVuln(v) }}</span>
      </div>
    </div>

    <div v-if="atendido.notas" class="report-section">
      <h2 class="section-title">Notas</h2>
      <p class="notes-text">{{ atendido.notas }}</p>
    </div>

    <div class="report-section">
      <h2 class="section-title">Registrado por</h2>
      <table class="info-table">
        <tbody>
          <tr><td class="info-label">Cédula</td><td class="info-value">{{ atendido.cedula_personal }}</td></tr>
          <tr v-if="personal"><td class="info-label">Nombre</td><td class="info-value">{{ personal.nombre }}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer-signature">
      <p>Firma del responsable: _______________________________</p>
      <p>Sello: ______________________________________________</p>
    </div>
  </div>
</template>

<style scoped>
.report { font-family: 'Inria Sans', Arial, sans-serif; color: #333; max-width: 210mm; margin: 0 auto; padding: 40px 32px; }
.report-header { text-align: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #00244D; }
.report-title { margin: 0; font-size: 22px; font-weight: 700; color: #00244D; text-transform: uppercase; letter-spacing: 1px; }
.report-date { margin: 8px 0 0; font-size: 11px; color: #666; }
.report-section { margin-bottom: 24px; page-break-inside: avoid; }
.section-title { margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #00244D; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 5px; border-bottom: 2px solid #145CAD; }
.info-table { width: 100%; border-collapse: collapse; }
.info-table td { padding: 5px 10px; font-size: 13px; }
.info-label { width: 180px; font-weight: 600; color: #666; vertical-align: top; }
.info-value { color: #333; }
.vuln-badge { display: inline-block; padding: 4px 12px; font-size: 12px; background: #FFF3E0; color: #E65100; border-radius: 12px; margin: 2px; }
.notes-text { margin: 8px 0 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.footer-signature { margin-top: 48px; padding-top: 16px; border-top: 1px solid #BEBEBE; }
.footer-signature p { margin: 8px 0; font-size: 12px; color: #666; }
</style>
