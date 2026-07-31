# Sistema de Reporte FTR

PWA Offline-First para el registro y gestión de misiones, atenciones y necesidades en zonas de desastre, operada por grupos de voluntarios y profesionales.

## Arquitectura

- **Frontend:** Vue 3 + TypeScript + Pinia + Vite
- **Base de datos:** Supabase (PostgreSQL) + IndexedDB (offline)
- **Sincronización:** Automática al detectar conexión
- **Autenticación:** Supabase Auth con sesión persistente

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Estado | Pinia |
| Ruteo | Vue Router |
| Estilos | CSS vanilla + clases utilitarias |
| Iconos | Lucide Vue |
| Validación | Zod v4 |
| BBDD Online | Supabase (PostgreSQL) |
| BBDD Offline | IndexedDB (vía idb) |
| Build | Vite |

## Decisiones de diseño

### Autenticación: solo online
El login requiere conexión a internet. No existe login offline. Una vez autenticado, la sesión persiste vía `LAST_USER_KEY` en localStorage para que el usuario pueda operar la app sin conexión durante una misión en campo.

### Creación de usuarios: solo online
La creación de usuarios (director, administrador, coordinador, personal) solo puede hacerse con conexión a internet. No tiene sentido crear usuarios offline. El botón "+ Nuevo Usuario" queda visible solo online.

### Contraseña por defecto
La contraseña se genera como `V` + cédula del usuario (ej. `V-12345678` → `V12345678`). Es una funcionalidad deliberada para facilitar el despliegue en campo. El administrador debe indicar al usuario que cambie su contraseña en el primer inicio de sesión.

### Offline-first solo en misión activa
La app almacena datos localmente en IndexedDB para permitir el registro de atenciones y necesidades en zonas sin cobertura. Cuando hay conexión, los datos se sincronizan inmediatamente con Supabase. Las pantallas de administración (usuarios, dashboard, reportes) requieren conexión para funcionar correctamente.

## Roles de usuario

| Rol | Permisos |
|---|---|
| **Director** | CRUD completo, eliminar usuarios, estadísticas globales |
| **Administrador** | Ver todos los reportes e información del personal (solo lectura) |
| **Coordinador** | Crear misiones, asignar transporte y personal, cargar insumos |
| **Personal** | Registrar personas atendidas en una misión |

## Esquema de base de datos

### Tablas principales

| Tabla | Propósito |
|---|---|
| `perfiles` | Usuarios del sistema (cedula, nombre, rol, especialidad) |
| `misiones` | Misiones/zonas atendidas (dirección, municipio, estado, estatus) |
| `transporte` | Transporte asignado a cada misión |
| `personal_mision` | Personal asignado a cada misión |
| `insumos` | Insumos llevados a cada misión |
| `atendidos` | Personas atendidas en cada misión |
| `necesidades` | Necesidades reportadas en cada misión |
| `salidas_insumos` | Dispensación de insumos en campo |

### Convenciones

- **IDs:** UUID v4 generados en el cliente (prohibido usar IDs autoincrementales)
- **status_sync:** Cada registro tiene campo `status_sync` (`'pending'` o `'synced'`)

## Estrategia de sincronización

1. **Online:** Cada store intenta enviar a Supabase inmediatamente al crear/actualizar/eliminar un registro. Si la conexión falla, guarda localmente como `pending`.
2. **Offline:** Todos los datos se guardan en IndexedDB con `status_sync: 'pending'`.
3. **Auto-sync:** Al detectar conexión (`navigator.onLine`), se envía a Supabase en orden:
   1. Misiones
   2. Transporte
   3. Personal
   4. Insumos
   5. Atendidos
   6. Necesidades
   7. Salidas de insumos
4. **Status remoto:** Tras sincronizar, se actualiza `status_sync = 'synced'` en IndexedDB.

## Configuración del proyecto

```sh
# Variables de entorno (.env)
VITE_SUPABASE_URL=https://nsuskftwonycndueahqd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_vzRCttvf8v350JLPeKQKyQ_W2EFQicM
```

```sh
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Type-check
npx vue-tsc --noEmit

# Build producción
npm run build
```

## Migraciones de base de datos

```sh
# Aplicar migraciones pendientes
supabase db push

# Listar estado de migraciones
supabase migration list

# Reparar historial (si hay conflicto)
supabase migration repair --status applied <timestamp>
```

## Eliminación de usuarios

La eliminación permanente se hace desde el cliente autenticado (solo rol `director`):

1. **DELETE** a la tabla `perfiles` vía REST API
2. **Eliminación** de IndexedDB local

Esto elimina al usuario del sistema pero **no** lo borra de `auth.users` (la cuenta de Supabase Auth queda sin perfil asociado, por lo que no puede iniciar sesión). Los registros del usuario en otras tablas se conservan para auditoría.

### Edge Function (opcional)

Hay una Edge Function `delete-user` desplegada que sí borra de `auth.users` + `perfiles` usando `service_role`. Actualmente no se usa porque el CORS de Supabase Functions requiere configuración adicional en el dashboard:

1. Ir a: `https://supabase.com/dashboard/project/nsuskftwonycndueahqd/functions`
2. Configurar CORS origins
3. Cambiar `confirmDelete()` en `UsuariosView.vue` de `client.from('perfiles').delete()` a `client.functions.invoke('delete-user')`

## Bugs corregidos

| Bug | Descripción | Archivos |
|---|---|---|
| 1 | Columna `area_voluntariado` faltante en `personal_mision` | Migración SQL |
| 2 | Auto-sync no se dispara tras CRUD | `syncTrigger.ts`, `useSync.ts`, 6 stores |
| 3 | `status_sync` nunca queda `synced` remotamente | `useSync.ts` |
| 4 | Input concatenation en `cedula_personal` | Ya corregido |
| 5 | Offline login sin validación | `auth.ts` |
| 6 | Código muerto en DashboardView | `DashboardView.vue` |
| 7 | Password hardcodeada `'123456'` | `UsuariosView.vue` (ahora `V` + cédula) |
| 8 | Validación Zod en formularios | `schemas.ts` + 5 views |
| 9 | Eliminación real de usuarios | `UsuariosView.vue` |
| 10 | `seedUsuariosIfNeeded` escribía datos dummy sobre IndexedDB | `setup.ts`, `main.ts` |
| 11 | Trigger `handle_new_user` no sobrescribía rol tras signup | `UsuariosView.vue` |
| 12 | `usePrint()` acumulaba listeners duplicados | `composables/usePrint.ts` |
| 13 | Store `necesidades` sin `refresh()` ni branching online/offline | `stores/necesidades.ts` |
| 14 | `useSync()` llamado en 2 componentes (race condition) | `App.vue` |
| 15 | `refreshAllStores()` sin `transporteStore` | `composables/useSync.ts` |
| 16 | `initializeApp()` sin check offline | `lib/setup.ts` |
| 17 | `PersonalSelector.vue` sin try/catch en `loadFromSupabase` | `components/ui/PersonalSelector.vue` |
| 18 | `mapArea()` asignaba "Medicina Veterinaria" a medicina humana | `NuevaAtencionView.vue` |
| 19 | `personal_mision` con `area_voluntariado` desactualizada; ahora se prioriza el perfil del usuario | `NuevaAtencionView.vue` |
| 20 | Especialidad persistía al cambiar categoría de profesional a estudiante/voluntario | `UsuariosView.vue` |
