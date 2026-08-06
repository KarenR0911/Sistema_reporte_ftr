import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DesautorizadoView from '@/views/DesautorizadoView.vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/desautorizado',
      name: 'desautorizado',
      component: DesautorizadoView,
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'misiones',
          name: 'misiones',
          component: () => import('@/views/misiones/MisionesView.vue'),
          meta: { roles: ['director', 'administrador', 'coordinador'] },
        },
        {
          path: 'misiones/nueva',
          name: 'nueva-mision',
          component: () => import('@/views/misiones/NuevaMisionView.vue'),
          meta: { roles: ['director', 'administrador'] },
        },
        {
          path: 'misiones/:id',
          name: 'mision-detalle',
          component: () => import('@/views/misiones/MisionDetailView.vue'),
          meta: { roles: ['director', 'administrador', 'coordinador', 'personal'] },
        },
        {
          path: 'misiones/:id/necesidades',
          name: 'necesidades-mision',
          component: () => import('@/views/misiones/NecesidadesView.vue'),
          meta: { roles: ['director', 'administrador', 'coordinador'] },
        },
        {
          path: 'misiones/:id/dispensacion',
          name: 'dispensacion',
          component: () => import('@/views/dispensacion/DispensacionView.vue'),
          meta: { roles: ['director', 'administrador'] },
        },
        {
          path: 'atencion/nueva/:id_mision',
          name: 'nueva-atencion',
          component: () => import('@/views/atencion/NuevaAtencionView.vue'),
          meta: { roles: ['personal'] },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('@/views/UsuariosView.vue'),
          meta: { roles: ['director', 'administrador'] },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('@/views/reportes/ReportesView.vue'),
          meta: { roles: ['director', 'administrador', 'coordinador'] },
        },
        {
          path: 'logs',
          name: 'logs',
          component: () => import('@/views/LogsView.vue'),
          meta: { roles: ['director', 'administrador'] },
        },
        {
          path: 'perfil',
          name: 'perfil',
          component: () => import('@/views/perfil/MiPerfilView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restoreSession()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  const inactive = auth.isAuthenticated && !auth.isAuthorized

  if (to.path === '/desautorizado') {
    if (!auth.isAuthenticated) return '/login'
    if (!inactive) return '/dashboard'
    return true
  }

  if (inactive) {
    return '/desautorizado'
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return '/dashboard'
  }

  if (to.meta.roles && !(to.meta.roles as string[]).includes(auth.userRole ?? '')) {
    return '/dashboard'
  }
})

export default router
