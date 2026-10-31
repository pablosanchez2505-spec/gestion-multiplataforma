import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH } from './http-context.tokens';

/**
 * Interceptor de AUTENTICACIÓN (petición saliente).
 * Añade `Authorization: Bearer <token>` a todas las llamadas a nuestra API.
 * - No toca peticiones a terceros (no filtramos el token a otros dominios).
 * - No toca login/refresh (marcadas con SKIP_AUTH).
 * Los servicios de datos no saben nada de tokens: solo hacen http.get(...).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiCall = req.url.startsWith(environment.apiUrl);
  if (!isApiCall || req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const token = inject(AuthService).getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
