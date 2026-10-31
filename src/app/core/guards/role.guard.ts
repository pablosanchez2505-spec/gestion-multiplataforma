import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { Permission, UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Guard de AUTORIZACIÓN por rol (factory: recibe los roles permitidos).
 * Se usa en canMatch y SIEMPRE después de authMatchGuard (primero ¿quién eres?,
 * después ¿qué puedes hacer?).
 *
 *   canMatch: [authMatchGuard, roleGuard('admin', 'supervisor')]
 *
 * Sin el rol → /forbidden (el usuario está identificado, pero no autorizado).
 */
export const roleGuard = (...allowed: UserRole[]): CanMatchFn => () => {
  const auth = inject(AuthService);
  return auth.hasRole(...allowed) ? true : inject(Router).createUrlTree(['/forbidden']);
};

/** Variante por permiso concreto (más fina que el rol). */
export const permissionGuard = (...required: Permission[]): CanMatchFn => () => {
  const auth = inject(AuthService);
  return auth.hasPermission(...required) ? true : inject(Router).createUrlTree(['/forbidden']);
};
