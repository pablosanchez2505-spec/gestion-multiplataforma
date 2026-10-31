// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  /** Prefijo de la API. El interceptor de auth solo añade el token a estas URLs. */
  apiUrl: '/api',
  /**
   * Sin backend real: un interceptor (mockBackendInterceptor) simula la API,
   * firma tokens, valida el Bearer y devuelve 401/403 como lo haría un servidor.
   */
  useMockBackend: true,
  /** Segunda fuente de datos (NoSQL en tiempo real). Vacío = almacén local. */
  firebase: firebaseConfig,
  /** Vida del access token en el backend simulado (corta para probar el refresh). */
  accessTokenTtlSeconds: 120,
  refreshTokenTtlSeconds: 60 * 60 * 24,
};
