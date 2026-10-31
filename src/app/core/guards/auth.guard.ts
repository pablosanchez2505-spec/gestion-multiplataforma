import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Lógica común: si hay sesión deja pasar; si no, redirige a /login
 * guardando la URL que se intentaba abrir (returnUrl) para volver tras el login.
 */
function requireSession(attemptedUrl: string): true | UrlTree {
  const auth = inject(AuthService);
  if (auth.hasValidSession()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: attemptedUrl },
  });
}

/**
 * canActivate: se ejecuta cuando la ruta YA se ha emparejado.
 * Uso: rutas cuyo componente no pesa (o ya está cargado) — home, perfil.
 */
export const authGuard: CanActivateFn = (_route, state) => requireSession(state.url);

/**
 * canMatch: se ejecuta ANTES de emparejar la ruta. Si devuelve false/UrlTree
 * el router ni siquiera descarga el chunk lazy (loadChildren/loadComponent)
 * y PreloadAllModules tampoco lo precarga. Uso: zonas privadas pesadas (admin).
 */
export const authMatchGuard: CanMatchFn = (_route, segments) => requireSession(toUrl(segments));

/** Reconstruye la URL que se intentaba abrir a partir de los segmentos. */
export function toUrl(segments: UrlSegment[]): string {
  return '/' + segments.map(s => s.path).join('/');
}
