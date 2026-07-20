<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { getAll, addItem, putItem, deleteItem } from '@/db'
import { getSupabase, getAuthSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { usuarioSchema } from '@/lib/schemas'
import type { Usuario, CategoriaVoluntariado } from '@/types'

const auth = useAuthStore()
const usuarios = ref<Usuario[]>([])
const showUserForm = ref(false)
const editingUser = ref<Usuario | null>(null)
const _formCedula = ref('')
const formCedula = computed({
  get: () => _formCedula.value,
  set: (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8)
    _formCedula.value = digits ? 'V-' + digits : ''
  },
})
const formNombre = ref('')
const formRol = ref('')
const formCategoriaVoluntariado = ref<string>('')
const formEspecialidad = ref('')
const formAreaVoluntariado = ref('')
const formErrors = ref<Record<string, string>>({})

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

const showCreatedDialog = ref(false)
const createdUser = ref<{ cedula: string; nombre: string; email: string; password: string } | null>(null)

const tempPassword = computed(() => 'V' + formCedula.value.replace(/\D/g, ''))

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
          email: `${p.cedula}@ftr.app`,
          rol: p.rol as Usuario['rol'],
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

function validateForm(): boolean {
  formErrors.value = {}
  const payload: Record<string, unknown> = {
    cedula: formCedula.value,
    nombre: formNombre.value,
    rol: formRol.value,
  }
  if (formRol.value === 'personal') {
    payload.categoria_voluntariado = formCategoriaVoluntariado.value
    payload.especialidad = formEspecialidad.value
    payload.area_voluntariado = formAreaVoluntariado.value
  }
  const result = usuarioSchema.safeParse(payload)
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    useToastStore().error('Corrige los errores del formulario')
    return false
  }
  return true
}

async function saveUser() {
  if (!validateForm()) return
  const isNew = !editingUser.value
  const esPersonal = formRol.value === 'personal'
  const email = `${formCedula.value}@ftr.app`
  const user: Usuario = {
    id: editingUser.value?.id ?? crypto.randomUUID(),
    cedula: formCedula.value,
    nombre: formNombre.value,
    email,
    rol: formRol.value as Usuario['rol'],
    activo: true,
    categoria_voluntariado: esPersonal ? (formCategoriaVoluntariado.value as CategoriaVoluntariado) : undefined,
    especialidad: esPersonal ? formEspecialidad.value : '',
    area_voluntariado: esPersonal ? formAreaVoluntariado.value : '',
  }

  if (navigator.onLine && isNew) {
    try {
      const { error } = await getSupabase().auth.signUp({
        email: user.email,
        password: tempPassword.value,
        options: {
          data: {
            cedula: user.cedula,
            nombre: user.nombre,
            rol: user.rol,
            categoria_voluntariado: user.categoria_voluntariado ?? null,
            especialidad: user.especialidad ?? '',
            area_voluntariado: user.area_voluntariado ?? '',
          },
        },
      })
      if (!error) {
        await putItem('usuarios', user)
        createdUser.value = { cedula: user.cedula, nombre: user.nombre, email: user.email, password: tempPassword.value }
        showCreatedDialog.value = true
      } else {
        await putItem('usuarios', user)
        const client = auth.accessToken ? getAuthSupabase(auth.accessToken) : getSupabase()
        await client.from('perfiles').upsert({
          id: user.id,
          cedula: user.cedula,
          nombre: user.nombre,
          rol: user.rol,
          categoria_voluntariado: user.categoria_voluntariado ?? null,
          especialidad: user.especialidad ?? '',
          area_voluntariado: user.area_voluntariado ?? '',
          activo: true,
        }).catch(() => {})
        useToastStore().error('Guardado localmente. Supabase Auth: ' + error.message)
      }
    } catch {
      await putItem('usuarios', user)
      useToastStore().error('Guardado localmente. Error de red al crear en Supabase Auth.')
    }
  } else if (navigator.onLine && !isNew) {
    const client = auth.accessToken
      ? getAuthSupabase(auth.accessToken)
      : getSupabase()
    await client.from('perfiles').update({
      cedula: user.cedula,
      nombre: user.nombre,
      rol: user.rol,
      categoria_voluntariado: user.categoria_voluntariado ?? null,
      especialidad: user.especialidad ?? '',
      area_voluntariado: user.area_voluntariado ?? '',
    }).eq('id', user.id)
    await putItem('usuarios', user)
    useToastStore().success('Usuario actualizado exitosamente')
  } else {
    if (isNew) {
      await putItem('usuarios', user)
      useToastStore().success('Usuario creado en modo local')
    } else {
      await putItem('usuarios', user)
      useToastStore().success('Usuario actualizado en modo local')
    }
  }
  resetForm()
  await loadUsuarios()
}

function editUser(u: Usuario) {
  editingUser.value = u
  formCedula.value = u.cedula
  formNombre.value = u.nombre
  formRol.value = u.rol
  formCategoriaVoluntariado.value = u.categoria_voluntariado ?? ''
  formEspecialidad.value = u.especialidad ?? ''
  formAreaVoluntariado.value = u.area_voluntariado ?? ''
  showUserForm.value = true
}

async function toggleActivo(u: Usuario) {
  const updated = { ...u, activo: !u.activo }
  if (navigator.onLine) {
    const client = auth.accessToken
      ? getAuthSupabase(auth.accessToken)
      : getSupabase()
    await client.from('perfiles').update({ activo: updated.activo }).eq('id', updated.id)
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
  const userId = userToDelete.value.id
  if (navigator.onLine) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const resp = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ userId }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        useToastStore().error(data.error ?? 'Error al eliminar usuario')
        return
      }
    } catch (e) {
      useToastStore().error('Error de red al eliminar usuario')
      return
    }
  }
  await deleteItem('usuarios', userId)
  showDeleteModal.value = false
  userToDelete.value = null
  await loadUsuarios()
  useToastStore().success('Usuario eliminado permanentemente')
}

function resetForm() {
  showUserForm.value = false
  editingUser.value = null
  formCedula.value = ''
  formNombre.value = ''
  formRol.value = ''
  formCategoriaVoluntariado.value = ''
  formEspecialidad.value = ''
  formAreaVoluntariado.value = ''
}

onMounted(async () => {
  await loadUsuarios()
})
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl text-brand m-0">Gestión de Usuarios</h1>
      <div class="flex items-center gap-2">
        <span class="text-sm text-text-secondary">{{ totalUsuarios }} usuarios</span>
      </div>
    </div>

    <BaseCard title="Usuarios del Sistema">
      <template #default>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <BaseButton variant="primary" @click="showUserForm = true" class="w-full sm:w-auto">
            + Nuevo Usuario
          </BaseButton>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <BaseInput v-model="searchQuery" placeholder="Buscar..." class="w-full sm:w-60" />
            <BaseSelect
              v-model="filtroRol"
              :options="[
                { value: '', label: 'Todos los roles' },
                { value: 'director', label: 'Director' },
                { value: 'administrador', label: 'Administrador' },
                { value: 'coordinador', label: 'Coordinador' },
                { value: 'personal', label: 'Personal' },
              ]"
              class="w-full sm:w-44"
            />
            <BaseSelect
              v-model="filtroTipo"
              :options="[
                { value: '', label: 'Todos los tipos' },
                { value: 'estudiante', label: 'Estudiante' },
                { value: 'profesional', label: 'Profesional' },
                { value: 'voluntario', label: 'Voluntario' },
              ]"
              class="w-full sm:w-44"
            />
          </div>
        </div>

        <div v-if="showUserForm" class="bg-bg p-4 rounded-lg mb-4">
          <h3 class="m-0 mb-3 text-brand">{{ editingUser ? 'Editar' : 'Nuevo' }} Usuario</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <BaseInput v-model="formCedula" label="Cédula" required :error="formErrors.cedula" @update:model-value="val => { formCedula.value = val.replace(/\D/g, '').replace(/^/, 'V-'); formErrors.cedula = '' }" maxlength="10" />
            <BaseInput v-model="formNombre" label="Nombre" required :error="formErrors.nombre" @update:model-value="formErrors.nombre = ''" />
            <BaseSelect
              v-model="formRol"
              label="Rol"
              :error="formErrors.rol"
              :options="[
                { value: 'director', label: 'Director' },
                { value: 'administrador', label: 'Administrador' },
                { value: 'coordinador', label: 'Coordinador' },
                { value: 'personal', label: 'Personal' },
              ]"
              required
            />
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
            <StatusBadge :status="(row as unknown as Usuario).activo ? 'activo' : 'inactivo'" />
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
      title="Eliminar usuario"
      :message="userToDelete ? `¿Eliminar permanentemente a ${userToDelete.nombre} (${userToDelete.cedula})?` : ''"
      description="Se borrará de Supabase Auth y del sistema. Sus registros en misiones, atenciones y reportes se conservarán para auditoría. Esta acción no se puede deshacer."
      confirm-text="Sí, eliminar permanentemente"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <Teleport to="body">
      <div v-if="showCreatedDialog && createdUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-1000" @click.self="showCreatedDialog = false">
        <div class="bg-white rounded-xl p-8 max-w-100 w-90% flex flex-col gap-4 shadow-2xl">
          <h2 class="m-0 text-brand text-xl">Usuario Creado</h2>
          <div class="flex flex-col gap-2 text-sm">
            <div><span class="font-semibold">Cédula:</span> {{ createdUser.cedula }}</div>
            <div><span class="font-semibold">Nombre:</span> {{ createdUser.nombre }}</div>
            <div><span class="font-semibold">Email:</span> {{ createdUser.email }}</div>
            <div class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span class="font-semibold">Contraseña temporal:</span>
              <span class="ml-1 font-mono text-brand text-base select-all">{{ createdUser.password }}</span>
            </div>
            <p class="text-text-secondary text-xs mt-1">Comparte esta contraseña con el usuario. Deberá cambiarla al iniciar sesión.</p>
          </div>
          <div class="flex justify-end mt-2">
            <BaseButton variant="primary" @click="showCreatedDialog = false">Cerrar</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
