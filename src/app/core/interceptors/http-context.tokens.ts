import { HttpContextToken } from '@angular/common/http';

/** Marca peticiones que NO deben llevar Authorization (login, refresh). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** Marca una petición ya reintentada tras un refresh, para evitar bucles 401 → refresh → 401. */
export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

/** Permite a un componente gestionar él mismo un 403 sin que el interceptor redirija. */
export const SKIP_FORBIDDEN_REDIRECT = new HttpContextToken<boolean>(() => false);
