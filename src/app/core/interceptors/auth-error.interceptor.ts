import {
  HttpContext, HttpErrorResponse, HttpInterceptorFn, HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { RETRIED_AFTER_REFRESH, SKIP_AUTH, SKIP_FORBIDDEN_REDIRECT } from './http-context.tokens';

/**
 * Interceptor de ERRORES DE SESIÓN (respuesta entrante).
 * Va el PRIMERO en la cadena, así al reintentar con next() la petición vuelve
 * a pasar por authInterceptor y sale con el token nuevo.
 *
 *  401 Unauthorized → token caducado/inválido:
 *      1. Pide un access token nuevo con el refresh token (una sola vez).
 *      2. Reintenta la petición original.
 *      3. Si el refresh falla → cierra sesión y manda al login con returnUrl.
 *  403 Forbidden → autenticado pero sin permiso → pantalla /forbidden.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const notify = async (message: string, color: 'warning' | 'danger') => {
    const toast = await toastCtrl.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  };

  const expireSession = () => {
    auth.logout(router.url);
    void notify('Tu sesión ha caducado. Vuelve a iniciar sesión.', 'warning');
  };

  return next(req).pipe(
    catchError((error: unknown) => {
      // Login/refresh gestionan sus propios errores (credenciales incorrectas, etc.)
      if (!(error instanceof HttpErrorResponse) || req.context.get(SKIP_AUTH)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        // Ya se reintentó con un token recién renovado y sigue fallando → fin de sesión
        if (req.context.get(RETRIED_AFTER_REFRESH)) {
          expireSession();
          return throwError(() => error);
        }
        return auth.refreshAccessToken().pipe(
          switchMap(() => next(markAsRetried(req))),
          catchError((retryError: unknown) => {
            // Si el error viene del refresh (no del reintento), cerramos sesión aquí
            if (!(retryError instanceof HttpErrorResponse) || retryError.url?.includes('/auth/refresh')) {
              expireSession();
            }
            return throwError(() => retryError);
          }),
        );
      }

      if (error.status === 403 && !req.context.get(SKIP_FORBIDDEN_REDIRECT)) {
        void notify('No tienes permisos para realizar esta acción.', 'danger');
        router.navigate(['/forbidden']);
      }

      return throwError(() => error);
    }),
  );
};

/** Copia la petición marcándola como reintentada (HttpContext es mutable: se copia). */
function markAsRetried(req: HttpRequest<unknown>): HttpRequest<unknown> {
  const context = new HttpContext();
  for (const key of req.context.keys()) {
    context.set(key, req.context.get(key));
  }
  context.set(RETRIED_AFTER_REFRESH, true);
  return req.clone({ context });
}
