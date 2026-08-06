# Sistema de Reporte FTR

Sistema de reporte por zonas / "grupos de apoyo" para brigadas de voluntarios y profesionales. Es una **Progressive Web App Offline-First**: los entornos donde operan no siempre tienen conexión, por lo que todo el registro de campo funciona sin internet y se sincroniza cuando hay señal.

## Stack y arquitectura

- **Frontend**: Vue 3 (Composition API, `<script setup>`) + TypeScript + Pinia + Vue Router + Tailwind CSS v4.
- **Persistencia local**: IndexedDB vía `idb` (base `sistema-reporte-ftr`, versión 9). **No se usa localStorage** para datos (muy limitado).
- **Backend**: Supabase — Postgres con RLS, Auth (email/contraseña) y Edge Functions (Deno) para operaciones con `service_role`.
- **PWA**: `vite-plugin-pwa` (service worker) para arrancar 100% offline.
- **Generación de reportes**: componentes de impresión puros que usan `window.print()` (CSS `@media print`).

## Estrategia de sincronización

- **IDs**: está prohibido usar IDs numéricos autoincrementables. Todos los registros usan **UUID v4 generados en el cliente** (`crypto.randomUUID()`), así múltiples teléfonos offline jamás colisionan al sincronizar.
- **Estado de sincronización**: cada registro tiene `status_sync` (`'pending'` → `'synced'`).
- **Operación offline**: todo se guarda en IndexedDB con `status_sync: 'pending'`. El usuario ve el estado de conexión (En línea / Offline) en la interfaz.
- **Sincronización automática** (`src/composables/useSync.ts`): al recuperar conexión (`navigator.onLine`) hace *pull* de Supabase (respetando pendientes locales), *upsert* de lo pendiente, y replica los borrados registrados en el store `_deleted`. El orden de sincronización es: atendidos, necesidades, salidas, insumos, misiones, personal.
- El desencadenador de resincronización por cambios locales es `src/lib/syncTrigger.ts` (`markNeedsSync`).

## Modelo de datos (tablas en Supabase)

- **perfiles** — usuarios del sistema: `id` (UUID de auth), `cedula`, `nombre`, `email`, `rol` (director/administrador/coordinador/personal), `activo`, `categoria_voluntariado` (estudiante/profesional/voluntario), `especialidad`, `area_voluntariado`.
- **misiones** — zonas de trabajo: `id`, `direccion`, `municipio`, `estado`, `fecha_inicio`, `estatus_mision` (activa/completada/cancelada), `status_sync`.
- **insumos** — insumos llevados a la misión: `id`, `id_mision`, `categoria`, `descripcion`, `cantidad`, `unidad`, `observaciones`, `status_sync`.
- **personal_mision** — personal/voluntarios/profesionales asignados: `id`, `id_mision`, `cedula`, `nombre`, `categoria_voluntariado`, `especialidad`, `area_voluntariado`, `status_sync`.
- **atendidos** — registros de atención (humanos y animales): `id`, `id_mision`, `cedula_personal`, `cedula_atendido`, `nombre_atendido`, `telefono_contacto`, `fecha_hora_atencion`, `edad`, `sexo`, `tipo_atencion`, `referido`, `vulnerabilidad` (array JSON), `notas`, `area_registro` (general/medicina_humana/psicologia/veterinaria/logistica), `lugar_vivia`, `lugar_actual`, `motivo_atencion`, `insumo_entregado`, `especie`, `posee_tutor`, `rescatado`, `en_adopcion`, `diagnostico_tentativo`, `status_sync`.
- **necesidades** — insumos en necesidad levantados en campo: `id`, `id_mision`, `categoria`, `descripcion`, `cantidad_requerida`, `unidad`, `observaciones`, `prioridad` (baja/media/alta/critica), `estatus` (reportado/enproceso/atendido), `status_sync`.
- **salidas_insumos** — dispensación de insumos: `id`, `id_mision`, `id_insumo`, `cantidad`, `motivo`, `registrado_por`, `created_at`, `status_sync`.
- **registro_logs** — auditoría (append-only): `id`, `usuario_id` (de auth), `usuario_cedula`, `usuario_nombre`, `usuario_rol` (snapshot al momento), `entidad` (mision/atendido/necesidad/insumo/personal/salida/usuario/sesion), `accion` (crear/actualizar/eliminar/login/logout), `registro_id`, `resumen`, `created_at`. RLS: SELECT solo director/administrador; INSERT solo con `auth.uid() = usuario_id` (anti-suplantación); sin UPDATE/DELETE.

El store de IndexedDB `usuarios` guarda una copia local de `perfiles` para funcionar offline. `salidas` en IndexedDB corresponde a la tabla `salidas_insumos`.

## Roles, privilegios y dashboards

Cada rol tiene su dashboard según sus funciones:

- **Director General**: acceso total — usuarios (crear/editar/eliminar/inactivar), insumos, misiones, reportes, logs del sistema. Sin ámbito por área.
- **Administrador**: puede ver reportes, logs e información del personal. Por decisión vigente también puede crear y eliminar usuarios. Sin ámbito por área.
- **Coordinador**: crea misiones, carga insumos y personal. **Ámbito por área**: solo ve misiones y reportes de su área.
- **Personal** (voluntarios/profesionales): registra atenciones. **Ámbito por área**: solo ve registros de su área.

**Ámbito por área** (feature reciente):
- `src/lib/area.ts` — mapeo entre el vocabulario del perfil (`area_voluntariado`, 14 valores) y el del registro (`area_registro`, 5 valores) vía `mapAreaToRegistro`.
- `src/composables/useAreaScope.ts` — expone `scopeArea` (null para director/administrador) y listas filtradas `scopedAtendidos`, `scopedPersonal`, `scopedMisiones`, `scopedNecesidades`. Las misiones/necesidades no tienen columna de área: la misión se considera del área si tiene atendidos o personal de esa área.
- Se aplica en Dashboard, lista/detalle de misiones y registro de atenciones. El Centro de Reportes aún usa su propio filtro de área (refactor pendiente).

## Centro de reportes

- **`/reportes`** (`ReportesView.vue`): 8 reportes globales imprimibles (Director, Cobertura Geográfica, Efectividad-Necesidades, Inventario de Insumos, Personal Desplegado, Atenciones Consolidado, Actividad del Personal, Veterinario). Solo director/administrador ven los 8; coordinador/personal ven únicamente el veterinario. Filtro de área solo para admin.
- **Por misión** (desde el detalle de misión): `MisionReport` (reporte completo de la misión), `PlanMision` (hoja de ruta pre-salida con checklist) y `FichaAtencion` (ficha imprimible de un solo registro, con firma y sello).

## Logs del sistema (auditoría)

- **`/logs`** (`LogsView.vue`): solo director/administrador. Filtros por usuario/acción/entidad/rango de fechas/búsqueda + tabla con fecha, usuario (nombre+cédula), rol, acción, entidad y detalle; imprimible.
- **Registro**: `src/lib/audit.ts` (`audit(entidad, accion, registroId?, resumen?)`) se llama desde los stores (`create/update/remove` de misiones, atendidos, necesidades, insumos, personal, salidasInsumos), desde `UsuariosView` (crear/editar/activar/desactivar/eliminar usuario) y desde `auth.ts` (login/logout). Es fire-and-forget: guarda en IndexedDB (`logs`, `status_sync`) e inserta en `registro_logs` si hay conexión; se sincroniza vía `useSync.ts`.
- **Append-only**: los logs no se editan ni borran desde la app (RLS lo impide). La purga manual solo sería por SQL.
- Todos son componentes de impresión puros: reciben datos por props desde la vista y agregan con `computed`.

## Seguridad

- **RLS en Supabase**: `perfiles_select` (todos los autenticados leen), `perfiles_update_own` (cada quien su fila), `perfiles_delete_director`. Las demás tablas permiten CRUD a autenticados; DELETE solo director/administrador.
- **Trigger `handle_new_user`** (`20260726000003`): al crearse un usuario en Auth inserta su fila en `perfiles` forzando `rol='personal'` (evita escalada de privilegios vía metadata); el panel lo sobreescribe con el rol elegido.
- **Edge functions** (`supabase/functions/`):
  - `create-user`: crea usuarios con `auth.admin.createUser` (service role) validando que el llamador sea director/administrador. **No cambia la sesión del creador** (a diferencia de `signUp`).
  - `delete-user`: elimina usuario de Auth y de `perfiles` validando rol de director.

## Estructura del proyecto

- `src/stores/` — stores Pinia por entidad (misiones, atendidos, necesidades, insumos, personal, salidasInsumos, logs, auth, toast, loading). Patrón: `load()` desde IndexedDB + `refresh()` contra Supabase; `create/update/remove` escriben local (pending) y tratan de persistir en línea.
- `src/db/` — helpers de IndexedDB (getAll, addItem, putItem, deleteItem, getPending, markAsSynced, _deleted).
- `src/lib/` — supabase client, schemas (zod), área, sync trigger, auditoría (`audit.ts`), utilidades.
- `src/views/` — Login, Dashboard, Usuarios, Misiones (lista, nueva, detalle, necesidades), Atención, Dispensación, Reportes, Logs, Perfil, Desautorizado.
- `src/router/` — guard de navegación: restaura sesión y aplica `meta.roles` por ruta; usuarios inactivos ven "Desautorizado".

## Comandos

- `npm run dev` — servidor de desarrollo (Vite).
- `npm run type-check` — `vue-tsc --build`.
- `npm run lint` / `lint:oxlint` / `lint:eslint` — linters.
- `npm run build` — type-check + build.
- `supabase functions deploy <nombre>` — desplegar edge function.
- `supabase db push` — aplicar migraciones.

## Identidad visual y UI

- **Tipografía principal**: Inria Sans.
- **Paleta**:
  - Fondos/superficies: Light Gray `#F5F5F5` / `#F0F0F0`, Blanco `#FFFFFF`.
  - Textos: Dark Gray `#333333` / `#666666`, Negro `#000000`.
  - Marca/énfasis primario: Azul Corporativo `#00244D`.
  - Interactivos (botones/links): Azul Vivo `#145CAD`, `#1FAAE1`, `#127BA4`.
  - Estados/alertas: Celeste Claro `#68B1ED`, Menta/Neutral `#8FBFBF`.
  - Bordes/deshabilitados: Gris `#BEBEBE`, `#E3E3E3`.
- Componentes UI base en `src/components/ui/` (BaseButton, BaseCard, BaseInput, BaseSelect, BaseTable, StatusBadge, ConfirmDialog, PersonalSelector, etc.).
