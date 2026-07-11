import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
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
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          redirect: () => {
            const auth = useAuthStore()
            const role = auth.userRole
            if (role === 'director') return '/director'
            if (role === 'administrador') return '/admin'
            if (role === 'coordinador') return '/coordinador'
            if (role === 'personal') return '/personal'
            return '/login'
          },
        },
        {
          path: 'director',
          name: 'director',
          component: () => import('@/views/director/DirectorDashboard.vue'),
          meta: { role: 'director' },
        },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('@/views/admin/AdminDashboard.vue'),
          meta: { role: 'administrador' },
        },
        {
          path: 'coordinador',
          name: 'coordinador',
          component: () => import('@/views/coordinador/CoordinatorDashboard.vue'),
          meta: { role: 'coordinador' },
          children: [
            {
              path: 'nueva-mision',
              name: 'nueva-mision',
              component: () => import('@/views/coordinador/NewMissionView.vue'),
            },
            {
              path: 'mision/:id',
              name: 'mision-detalle',
              component: () => import('@/views/coordinador/MissionDetailView.vue'),
            },
            {
              path: 'necesidades/:id',
              name: 'necesidades-mision',
              component: () => import('@/views/coordinador/NeedsReportView.vue'),
            },
          ],
        },
        {
          path: 'personal',
          name: 'personal',
          component: () => import('@/views/personal/VolunteerDashboard.vue'),
          meta: { role: 'personal' },
          children: [
            {
              path: 'nueva-atencion/:id_mision',
              name: 'nueva-atencion',
              component: () => import('@/views/personal/NewAttendeeView.vue'),
            },
          ],
        },
      ],
    },
  ],
})

router.beforeEach((to, from) => {
  const auth = useAuthStore()
  auth.restoreSession()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return '/dashboard'
  }

  if (to.meta.role && to.meta.role !== auth.userRole) {
    return '/dashboard'
  }
})

export default router
