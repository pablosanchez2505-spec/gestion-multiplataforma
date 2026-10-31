import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authErrorInterceptor } from './app/core/interceptors/auth-error.interceptor';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { mockBackendInterceptor } from './app/core/mock/mock-backend.interceptor';
import { environment } from './environments/environment';

/**
 * Cadena de interceptores (el orden importa):
 *   petición  →  authErrorInterceptor → authInterceptor → [mockBackend | red]
 *   respuesta ←  authErrorInterceptor ← authInterceptor ← [mockBackend | red]
 * 1. authErrorInterceptor va primero para que, al reintentar tras el refresh,
 *    la petición vuelva a pasar por authInterceptor y salga con el token nuevo.
 * 2. authInterceptor añade el Bearer.
 * 3. mockBackendInterceptor (solo sin API real) hace de servidor.
 */
const interceptors: HttpInterceptorFn[] = [authErrorInterceptor, authInterceptor];
if (environment.useMockBackend) {
  interceptors.push(mockBackendInterceptor);
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
  ],
});
