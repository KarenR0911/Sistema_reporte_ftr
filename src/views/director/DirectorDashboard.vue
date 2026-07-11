<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMisionesStore } from '@/stores/misiones'
import { useInsumosStore } from '@/stores/insumos'
import { useAtendidosStore } from '@/stores/atendidos'
import { useNecesidadesStore } from '@/stores/necesidades'

const ESTADOS_VENEZUELA = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
  'Guárico', 'La Guaira', 'Lara', 'Mérida', 'Miranda', 'Monagas',
  'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo',
  'Yaracuy', 'Zulia',
] as const
import { getAll, addItem, putItem } from '@/db'
import { supabase } from '@/lib/supabase'
import type { Usuario, CategoriaVoluntariado } from '@/types'

const misionesStore = useMisionesStore()
const insumosStore = useInsumosStore()
const atendidosStore = useAtendidosStore()
const necesidadesStore = useNecesidadesStore()

const usuarios = ref<Usuario[]>([])
const showUserForm = ref(false)
const editingUser = ref<Usuario | null>(null)
const formCedula = ref('')
const formNombre = ref('')
const formEmail = ref('')
const formRol = ref('')
const formPassword = ref('')
const formCategoriaVoluntariado = ref<string>('')
const formEspecialidad = ref('')
const formAreaVoluntariado = ref('')

watch(formRol, (val) => {
  if (val !== 'personal') {
    formCategoriaVoluntariado.value = ''
    formEspecialidad.value = ''
    formAreaVoluntariado.value = ''
  }
})

const showDeleteModal = ref(false)
const userToDelete = ref<Usuario | null>(null)

const totalMisiones = computed(() => misionesStore.list.length)
const totalAtendidos = computed(() => atendidosStore.list.length)
const totalNecesidades = computed(() => necesidadesStore.list.length)
const misionesActivas = computed(() =>
  misionesStore.list.filter((m) => m.estatus_mision === 'activa').length,
)

type EstadoData = { estado: string; total: number; color: string }

const ESTADO_COLORS = [
  '#145CAD', '#1FAAE1', '#127BA4', '#68B1ED', '#8FBFBF',
  '#4A90D9', '#2C6FAA', '#5BA3D9', '#3D8EB9', '#7BB8D9',
  '#1A6DB5', '#3A9FD4', '#5BAED9', '#2E82B5', '#6BA8CC',
  '#4B9FBF', '#1F8DB5', '#3F9FC4', '#6FB3CC', '#2F7FA4',
  '#5FA3BF', '#8FC4D9', '#4A9FBF', '#7AB8CC',
]

const insumosPorEstado = computed(() => {
  const map = new Map<string, number>()
  for (const ins of insumosStore.list) {
    if (ins.estatus_cargamento !== 'entregado') continue
    const mision = misionesStore.getById(ins.id_mision)
    if (!mision) continue
    const est = mision.estado
    map.set(est, (map.get(est) ?? 0) + ins.cantidad)
  }
  const result: EstadoData[] = []
  for (const [estado, total] of map) {
    const idx = ESTADOS_VENEZUELA.indexOf(estado as typeof ESTADOS_VENEZUELA[number])
    const colorIdx = idx >= 0 ? idx : result.length % ESTADO_COLORS.length
    result.push({ estado, total, color: ESTADO_COLORS[colorIdx]! })
  }
  return result.sort((a, b) => b.total - a.total)
})

const atendidosPorEstado = computed(() => {
  const map = new Map<string, number>()
  for (const at of atendidosStore.list) {
    const mision = misionesStore.getById(at.id_mision)
    if (!mision) continue
    const est = mision.estado
    map.set(est, (map.get(est) ?? 0) + 1)
  }
  const result: EstadoData[] = []
  for (const [estado, total] of map) {
    const idx = ESTADOS_VENEZUELA.indexOf(estado as typeof ESTADOS_VENEZUELA[number])
    const colorIdx = idx >= 0 ? idx : result.length % ESTADO_COLORS.length
    result.push({ estado, total, color: ESTADO_COLORS[colorIdx]! })
  }
  return result.sort((a, b) => b.total - a.total)
})

const totalInsumosEntregados = computed(() =>
  insumosPorEstado.value.reduce((sum, e) => sum + e.total, 0),
)

const totalAtendidosGeneral = computed(() =>
  atendidosPorEstado.value.reduce((sum, e) => sum + e.total, 0),
)

const insumosConic = computed(() => {
  const total = totalInsumosEntregados.value
  if (!total) return ''
  let acum = 0
  const stops = insumosPorEstado.value.map((e) => {
    const pct = Math.round((e.total / total) * 100)
    const start = acum
    acum += pct
    return `${e.color} ${start}% ${acum}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

const atendidosConic = computed(() => {
  const total = totalAtendidosGeneral.value
  if (!total) return ''
  let acum = 0
  const stops = atendidosPorEstado.value.map((e) => {
    const pct = Math.round((e.total / total) * 100)
    const start = acum
    acum += pct
    return `${e.color} ${start}% ${acum}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

const userColumns = [
  { key: 'cedula', label: 'Cédula' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'rol', label: 'Rol' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
]

async function loadUsuarios() {
  try {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        usuarios.value = data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          cedula: p.cedula as string,
          nombre: p.nombre as string,
          email: (p.email as string) ?? `${p.cedula}@ftr.app`,
          rol: p.rol as Usuario['rol'],
          password: '' as string,
          activo: p.activo as boolean,
          categoria_voluntariado: p.categoria_voluntariado as CategoriaVoluntariado | undefined,
          especialidad: (p.especialidad as string) ?? '',
          area_voluntariado: (p.area_voluntariado as string) ?? '',
        }))
        return
      }
    }
  } catch {
    // fallback a IndexedDB
  }
  usuarios.value = await getAll<Usuario>('usuarios')
}

async function saveUser() {
  const isNew = !editingUser.value
  const esPersonal = formRol.value === 'personal'
  const email = formEmail.value || `${formCedula.value}@ftr.app`
  const password = formPassword.value || '123456'
  const user: Usuario = {
    id: editingUser.value?.id ?? crypto.randomUUID(),
    cedula: formCedula.value,
    nombre: formNombre.value,
    email,
    rol: formRol.value as Usuario['rol'],
    password,
    activo: true,
    categoria_voluntariado: esPersonal ? (formCategoriaVoluntariado.value as CategoriaVoluntariado) : undefined,
    especialidad: esPersonal ? formEspecialidad.value : '',
    area_voluntariado: esPersonal ? formAreaVoluntariado.value : '',
  }

  const payload: Record<string, unknown> = {
    id: user.id,
    cedula: user.cedula,
    nombre: user.nombre,
    email: user.email,
    password: user.password,
    rol: user.rol,
    activo: user.activo,
    categoria_voluntariado: user.categoria_voluntariado ?? null,
    especialidad: user.especialidad ?? '',
    area_voluntariado: user.area_voluntariado ?? '',
  }

  if (navigator.onLine && isNew) {
    const { error: insertError } = await supabase.from('perfiles').insert(payload)
    if (!insertError) {
      await addItem('usuarios', user)
    } else {
      await addItem('usuarios', user)
    }
  } else if (navigator.onLine && !isNew) {
    await supabase.from('perfiles').update({
      cedula: user.cedula,
      nombre: user.nombre,
      email: user.email,
      password: user.password,
      rol: user.rol,
      categoria_voluntariado: payload.categoria_voluntariado,
      especialidad: payload.especialidad,
      area_voluntariado: payload.area_voluntariado,
    }).eq('id', user.id)
    await putItem('usuarios', user)
  } else {
    if (isNew) {
      await addItem('usuarios', user)
    } else {
      await putItem('usuarios', user)
    }
  }
  resetForm()
  await loadUsuarios()
}

function editUser(u: Usuario) {
  editingUser.value = u
  formCedula.value = u.cedula
  formNombre.value = u.nombre
  formEmail.value = u.email
  formRol.value = u.rol
  formPassword.value = ''
  formCategoriaVoluntariado.value = u.categoria_voluntariado ?? ''
  formEspecialidad.value = u.especialidad ?? ''
  formAreaVoluntariado.value = u.area_voluntariado ?? ''
  showUserForm.value = true
}

async function toggleActivo(u: Usuario) {
  const updated = { ...u, activo: !u.activo }
  if (navigator.onLine) {
    await supabase.from('perfiles').update({ activo: updated.activo }).eq('id', updated.id)
  }
  await putItem('usuarios', updated)
  await loadUsuarios()
}

function openDeleteModal(u: Usuario) {
  userToDelete.value = u
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  userToDelete.value = null
}

async function confirmDelete() {
  if (!userToDelete.value) return
  const updated = { ...userToDelete.value, activo: false }
  if (navigator.onLine) {
    await supabase.from('perfiles').update({ activo: false }).eq('id', updated.id)
  }
  await putItem('usuarios', updated)
  showDeleteModal.value = false
  userToDelete.value = null
  await loadUsuarios()
}

function resetForm() {
  showUserForm.value = false
  editingUser.value = null
  formCedula.value = ''
  formNombre.value = ''
  formEmail.value = ''
  formRol.value = ''
  formPassword.value = ''
  formCategoriaVoluntariado.value = ''
  formEspecialidad.value = ''
  formAreaVoluntariado.value = ''
}

onMounted(async () => {
  await Promise.all([
    misionesStore.load(),
    insumosStore.load(),
    atendidosStore.load(),
    necesidadesStore.load(),
    loadUsuarios(),
  ])

  if (window.location.hash === '#usuarios') {
    document.getElementById('usuarios')?.scrollIntoView({ behavior: 'smooth' })
  }
  if (window.location.hash === '#reportes') {
    document.getElementById('reportes')?.scrollIntoView({ behavior: 'smooth' })
  }
})
</script>

<template>
  <div class="director-dashboard">
    <h1 class="page-title">Panel del Director</h1>

    <div class="stats-grid">
      <BaseCard class="stat-card">
        <div class="stat-icon">🚀</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalMisiones }}</span>
          <span class="stat-label">Total Misiones</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-number">{{ misionesActivas }}</span>
          <span class="stat-label">Misiones Activas</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalAtendidos }}</span>
          <span class="stat-label">Atendidos</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalNecesidades }}</span>
          <span class="stat-label">Necesidades</span>
        </div>
      </BaseCard>
      <BaseCard class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <span class="stat-number">{{ usuarios.length }}</span>
          <span class="stat-label">Usuarios</span>
        </div>
      </BaseCard>
    </div>

    <div class="charts-grid" id="reportes">
      <BaseCard title="Misiones por Estado" class="chart-card">
        <div class="bar-chart">
          <div class="bar-item">
            <span class="bar-label">Activas</span>
            <div class="bar-track">
              <div
                class="bar-fill active"
                :style="{ width: totalMisiones ? (misionesActivas / totalMisiones * 100) + '%' : '0%' }"
              />
            </div>
            <span class="bar-value">{{ misionesActivas }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Completadas</span>
            <div class="bar-track">
              <div
                class="bar-fill completed"
                :style="{ width: totalMisiones ? ((totalMisiones - misionesActivas) / totalMisiones * 100) + '%' : '0%' }"
              />
            </div>
            <span class="bar-value">{{ totalMisiones - misionesActivas }}</span>
          </div>
        </div>
      </BaseCard>
      <BaseCard title="Resumen General" class="chart-card">
        <div class="donut-container">
          <div class="donut">
            <div class="donut-ring">
              <div class="donut-segment atendidos" :style="{ '--p': totalAtendidos + totalNecesidades ? Math.round(totalAtendidos / (totalAtendidos + totalNecesidades) * 100) : 0 }" />
            </div>
          </div>
          <div class="donut-legend">
            <span><span class="dot atendidos" /> Atendidos ({{ totalAtendidos }})</span>
            <span><span class="dot necesidades" /> Necesidades ({{ totalNecesidades }})</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Insumos Entregados por Estado" class="chart-card chart-wide">
        <div v-if="insumosPorEstado.length === 0" class="empty-chart">Sin datos</div>
        <div v-else class="donut-container">
          <div class="donut">
            <div class="donut-ring" :style="{ background: insumosConic }" />
          </div>
          <div class="donut-legend">
            <div class="legend-total"><strong>Total:</strong> {{ totalInsumosEntregados }}</div>
            <span v-for="e in insumosPorEstado" :key="e.estado" class="legend-item">
              <span class="dot" :style="{ background: e.color }" />
              {{ e.estado }} ({{ e.total }})
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Personas Atendidas por Estado" class="chart-card chart-wide">
        <div v-if="atendidosPorEstado.length === 0" class="empty-chart">Sin datos</div>
        <div v-else class="donut-container">
          <div class="donut">
            <div class="donut-ring" :style="{ background: atendidosConic }" />
          </div>
          <div class="donut-legend">
            <div class="legend-total"><strong>Total:</strong> {{ totalAtendidosGeneral }}</div>
            <span v-for="e in atendidosPorEstado" :key="e.estado" class="legend-item">
              <span class="dot" :style="{ background: e.color }" />
              {{ e.estado }} ({{ e.total }})
            </span>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard id="usuarios" title="Gestión de Usuarios">
      <template #default>
        <div class="section-actions">
          <BaseButton variant="primary" @click="showUserForm = true">
            + Nuevo Usuario
          </BaseButton>
        </div>

        <div v-if="showUserForm" class="user-form">
          <h3>{{ editingUser ? 'Editar' : 'Nuevo' }} Usuario</h3>
          <div class="form-grid">
            <BaseInput v-model="formCedula" label="Cédula" required />
            <BaseInput v-model="formNombre" label="Nombre" required />
            <BaseInput v-model="formEmail" label="Email" type="email" placeholder="usuario@ftr.app" />
            <BaseSelect
              v-model="formRol"
              label="Rol"
              :options="[
                { value: 'director', label: 'Director' },
                { value: 'administrador', label: 'Administrador' },
                { value: 'coordinador', label: 'Coordinador' },
                { value: 'personal', label: 'Personal' },
              ]"
              required
            />
            <BaseInput v-model="formPassword" label="Contraseña" type="password" />
            <template v-if="formRol === 'personal'">
              <BaseSelect
                v-model="formCategoriaVoluntariado"
                label="Tipo"
                :options="[
                  { value: 'estudiante', label: 'Estudiante' },
                  { value: 'profesional', label: 'Profesional' },
                  { value: 'voluntario', label: 'Voluntario' },
                ]"
              />
              <BaseInput
                v-if="formCategoriaVoluntariado === 'profesional'"
                v-model="formEspecialidad"
                label="Especialidad"
                placeholder="Médico, Enfermero, Psicólogo..."
              />
              <BaseInput
                v-model="formAreaVoluntariado"
                label="Área / Categoría del voluntariado"
                placeholder="Medicina, Logística, Alimentación..."
              />
            </template>
          </div>
          <div class="form-actions">
            <BaseButton variant="primary" @click="saveUser">Guardar</BaseButton>
            <BaseButton variant="ghost" @click="resetForm">Cancelar</BaseButton>
          </div>
        </div>

        <BaseTable :columns="userColumns" :rows="usuarios as unknown as Record<string, unknown>[]">
          <template #cell-rol="{ value }">
            <StatusBadge :status="value as string" />
          </template>
          <template #cell-tipo="{ row }">
            <span v-if="(row as unknown as Usuario).categoria_voluntariado">
              {{ (row as unknown as Usuario).categoria_voluntariado }}
              <span v-if="(row as unknown as Usuario).especialidad"> — {{ (row as unknown as Usuario).especialidad }}</span>
            </span>
            <span v-else class="text-muted">—</span>
          </template>
          <template #cell-activo="{ row }">
            <StatusBadge :status="(row as unknown as Usuario).activo ? 'synced' : 'cancelada'" />
          </template>
          <template #cell-acciones="{ row }">
            <div class="action-btns">
              <BaseButton size="sm" variant="ghost" @click="editUser(row as unknown as Usuario)">Editar</BaseButton>
              <BaseButton
                v-if="(row as unknown as Usuario).activo"
                size="sm"
                variant="danger"
                @click="openDeleteModal(row as unknown as Usuario)"
              >
                Eliminar
              </BaseButton>
              <BaseButton
                v-else
                size="sm"
                variant="ghost"
                @click="toggleActivo(row as unknown as Usuario)"
              >
                Activar
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </template>
    </BaseCard>

    <BaseCard title="Misiones Recientes">
      <BaseTable
        :columns="[
          { key: 'direccion', label: 'Dirección' },
          { key: 'municipio', label: 'Municipio' },
          { key: 'fecha_inicio', label: 'Fecha' },
          { key: 'estatus_mision', label: 'Estatus' },
        ]"
        :rows="misionesStore.list.slice(-5) as unknown as Record<string, unknown>[]"
      >
        <template #cell-estatus_mision="{ value }">
          <StatusBadge :status="value as string" type="mision" />
        </template>
      </BaseTable>
    </BaseCard>
  </div>

  <Teleport to="body">
    <div v-if="showDeleteModal && userToDelete" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <h2>Confirmar eliminación</h2>
        <p>
          ¿Estás seguro de eliminar al usuario <strong>{{ userToDelete.nombre }}</strong>
          ({{ userToDelete.cedula }})?
        </p>
        <p class="modal-warning">
          El usuario quedará inactivo pero sus registros en misiones, atenciones y reportes
          se conservarán.
        </p>
        <div class="modal-actions">
          <BaseButton variant="danger" @click="confirmDelete">Sí, eliminar</BaseButton>
          <BaseButton variant="ghost" @click="cancelDelete">Cancelar</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.director-dashboard { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 1.5rem; color: #00244D; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; }
.stat-icon { font-size: 2rem; }
.stat-info { display: flex; flex-direction: column; }
.stat-number { font-size: 1.8rem; font-weight: 800; color: #00244D; }
.stat-label { font-size: 0.85rem; color: #666; }
.section-actions { margin-bottom: 16px; }
.user-form {
  background: #F5F5F5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.user-form h3 { margin: 0 0 12px; color: #00244D; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.form-actions { display: flex; gap: 8px; }
.text-muted { color: #999; }
.action-btns { display: flex; gap: 4px; }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-wide { grid-column: span 2; }
.chart-card { min-height: 180px; }
.bar-chart { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
.bar-item { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 100px; font-size: 0.85rem; color: #666; }
.bar-track { flex: 1; height: 24px; background: #F0F0F0; border-radius: 12px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 12px; transition: width 0.5s; }
.bar-fill.active { background: #145CAD; }
.bar-fill.completed { background: #4CAF50; }
.bar-value { width: 30px; font-size: 0.9rem; font-weight: 700; color: #333; }

.donut-container { display: flex; align-items: center; gap: 24px; padding: 8px 0; }
.donut-ring { width: 100px; height: 100px; border-radius: 50%; background: #F0F0F0; position: relative; }
.donut-segment { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(#145CAD 0% var(--p), #8FBFBF var(--p) 100%); }
.donut-legend { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; max-height: 300px; overflow-y: auto; }
.legend-total { margin-bottom: 4px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.empty-chart { padding: 24px; text-align: center; color: #999; font-style: italic; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
.dot.atendidos { background: #145CAD; }
.dot.necesidades { background: #8FBFBF; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: #fff; border-radius: 12px; padding: 32px; max-width: 440px; width: 90%;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-content h2 { margin: 0; color: #00244D; font-size: 1.2rem; }
.modal-warning { font-size: 0.85rem; color: #666; margin: 0; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
