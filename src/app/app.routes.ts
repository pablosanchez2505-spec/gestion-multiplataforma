import { Routes } from '@angular/router';

import { authGuard, authMatchGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard, roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

/**
 * Mapa de acceso
 * ───────────────────────────────────────────────────────────────────────────
 *  Ruta        Guards                                   user  superv. admin
 *  /login      canActivate guest                         (solo sin sesión)
 *  /home       canActivate auth                           ✔     ✔      ✔
 *  /perfil     canActivate auth + canDeactivate cambios   ✔     ✔      ✔
 *  /productos   canActivate auth                           ✔     ✔      ✔
 *  /productos/nuevo canMatch permiso items:write + canDeactivate   ✘/✔
 *  /informes   canMatch auth + rol(supervisor, admin)     ✘     ✔      ✔
 *  /admin/**   canMatch auth + rol(admin)                 ✘     ✘      ✔
 *  /forbidden  pública (destino de los 403)
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/items/items.page').then(m => m.ItemsPage),
  },
  {
    path: 'productos/nuevo',
    canMatch: [authMatchGuard, permissionGuard('items:write')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./features/items/item-form.page').then(m => m.ItemFormPage),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
  },
  {
    // canMatch: si no es supervisor/admin el chunk de informes no se descarga
    path: 'informes',
    canMatch: [authMatchGuard, roleGuard('supervisor', 'admin')],
    loadComponent: () => import('./features/reports/reports.page').then(m => m.ReportsPage),
  },
  {
    // Zona de administración completa cargada en lazy con sus propias rutas hijas
    path: 'admin',
    canMatch: [authMatchGuard, roleGuard('admin')],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/forbidden/forbidden.page').then(m => m.ForbiddenPage),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
