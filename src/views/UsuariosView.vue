<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { getAll, addItem, putItem } from '@/db'
import { getSupabase } from '@/lib/supabase'
import type { Usuario, CategoriaVoluntariado } from '@/types'

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

const searchQuery = ref('')
const filtroRol = ref('')
const filtroTipo = ref('')

const showDeleteModal = ref(false)
const userToDelete = ref<Usuario | null>(null)

const filteredUsuarios = computed(() => {
  let list = usuarios.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (u) => u.cedula.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q),
    )
  }
  if (filtroRol.value) {
    list = list.filter((u) => u.rol === filtroRol.value)
  }
  if (filtroTipo.value) {
    list = list.filter((u) => u.categoria_voluntariado === filtroTipo.value)
  }
  return list
})

const totalUsuarios = computed(() => filteredUsuarios.value.length)

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
      const { data, error } = await getSupabase().from('perfiles')
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
  const password = formPassword.value || (editingUser.value ? editingUser.value.password : '123456')
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
    const { error: insertError } = await getSupabase().from('perfiles').insert(payload)
    if (!insertError) {
      await addItem('usuarios', user)
    } else {
      await addItem('usuarios', user)
    }
  } else if (navigator.onLine && !isNew) {
    await getSupabase().from('perfiles').update({
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
    await getSupabase().from('perfiles').update({ activo: updated.activo }).eq('id', updated.id)
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
    await getSupabase().from('perfiles').update({ activo: false }).eq('id', updated.id)
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
  await loadUsuarios()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl text-brand m-0">Gestión de Usuarios</h1>
      <div class="flex items-center gap-2">
        <span class="text-sm text-text-secondary">{{ totalUsuarios }} usuarios</span>
      </div>
    </div>

    <BaseCard title="Usuarios del Sistema">
      <template #default>
        <div class="flex justify-between items-center mb-4">
          <BaseButton variant="primary" @click="showUserForm = true">
            + Nuevo Usuario
          </BaseButton>
          <div class="flex items-center gap-2">
            <BaseInput v-model="searchQuery" placeholder="Buscar por cédula o nombre..." class="w-60" />
            <BaseSelect
              v-model="filtroRol"
              :options="[
                { value: '', label: 'Todos los roles' },
                { value: 'director', label: 'Director' },
                { value: 'administrador', label: 'Administrador' },
                { value: 'coordinador', label: 'Coordinador' },
                { value: 'personal', label: 'Personal' },
              ]"
              class="w-44"
            />
            <BaseSelect
              v-model="filtroTipo"
              :options="[
                { value: '', label: 'Todos los tipos' },
                { value: 'estudiante', label: 'Estudiante' },
                { value: 'profesional', label: 'Profesional' },
                { value: 'voluntario', label: 'Voluntario' },
              ]"
              class="w-44"
            />
          </div>
        </div>

        <div v-if="showUserForm" class="bg-bg p-4 rounded-lg mb-4">
          <h3 class="m-0 mb-3 text-brand">{{ editingUser ? 'Editar' : 'Nuevo' }} Usuario</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
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
              <BaseSelect
                v-if="formCategoriaVoluntariado === 'profesional'"
                v-model="formEspecialidad"
                label="Especialidad"
                :options="[
                  { value: 'medico', label: 'Médico' },
                  { value: 'enfermero', label: 'Enfermero' },
                  { value: 'paramedico', label: 'Paramédico' },
                  { value: 'psicologo', label: 'Psicólogo' },
                  { value: 'trabajador_social', label: 'Trabajador Social' },
                  { value: 'nutricionista', label: 'Nutricionista' },
                  { value: 'farmaceutico', label: 'Farmacéutico' },
                  { value: 'abogado', label: 'Abogado' },
                  { value: 'docente', label: 'Docente / Educador' },
                  { value: 'ingeniero_civil', label: 'Ingeniero Civil' },
                  { value: 'ingeniero_sistemas', label: 'Ingeniero de Sistemas' },
                  { value: 'comunicador_social', label: 'Comunicador Social' },
                  { value: 'administrador', label: 'Administrador' },
                  { value: 'contador', label: 'Contador' },
                  { value: 'otro', label: 'Otro' },
                ]"
              />
              <BaseSelect
                v-model="formAreaVoluntariado"
                label="Área / Categoría del voluntariado"
                :options="[
                  { value: 'medicina_salud', label: 'Medicina / Salud' },
                  { value: 'atencion_psicosocial', label: 'Atención Psicosocial' },
                  { value: 'alimentacion', label: 'Alimentación / Nutrición' },
                  { value: 'logistica', label: 'Logística / Transporte' },
                  { value: 'infraestructura', label: 'Infraestructura / Rehabilitación' },
                  { value: 'distribucion_insumos', label: 'Distribución de Insumos' },
                  { value: 'educacion', label: 'Educación / Formación' },
                  { value: 'asistencia_legal', label: 'Asistencia Legal' },
                  { value: 'comunicaciones', label: 'Comunicaciones / Prensa' },
                  { value: 'operaciones_rescate', label: 'Operaciones / Búsqueda y Rescate' },
                  { value: 'soporte_tecnico', label: 'Soporte Técnico' },
                  { value: 'administracion', label: 'Administración / Finanzas' },
                  { value: 'otro', label: 'Otro' },
                ]"
              />
            </template>
          </div>
          <div class="flex gap-2">
            <BaseButton variant="primary" @click="saveUser">Guardar</BaseButton>
            <BaseButton variant="ghost" @click="resetForm">Cancelar</BaseButton>
          </div>
        </div>

        <BaseTable :columns="userColumns" :rows="filteredUsuarios as unknown as Record<string, unknown>[]">
          <template #cell-rol="{ value }">
            <StatusBadge :status="value as string" />
          </template>
          <template #cell-tipo="{ row }">
            <span v-if="(row as unknown as Usuario).categoria_voluntariado">
              {{ (row as unknown as Usuario).categoria_voluntariado }}
              <span v-if="(row as unknown as Usuario).especialidad"> — {{ (row as unknown as Usuario).especialidad }}</span>
            </span>
            <span v-else class="text-text-muted">—</span>
          </template>
          <template #cell-activo="{ row }">
            <StatusBadge :status="(row as unknown as Usuario).activo ? 'synced' : 'cancelada'" />
          </template>
          <template #cell-acciones="{ row }">
            <div class="flex gap-1">
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

    <ConfirmDialog
      :show="showDeleteModal"
      title="Confirmar eliminación"
      :message="userToDelete ? `¿Estás seguro de eliminar al usuario ${userToDelete.nombre} (${userToDelete.cedula})?` : ''"
      description="El usuario quedará inactivo pero sus registros en misiones, atenciones y reportes se conservarán."
      confirm-text="Sí, eliminar"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
