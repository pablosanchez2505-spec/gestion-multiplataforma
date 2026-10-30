import { Routes } from '@angular/router';

/**
 * Rutas hijas de /admin. Este fichero (y todo lo que importa) va en un chunk
 * aparte que solo se descarga si canMatch del padre deja pasar (rol admin).
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../dashboard/dashboard.page').then(m => m.DashboardPage),
  },
];
