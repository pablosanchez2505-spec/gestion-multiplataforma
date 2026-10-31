import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Estrategia de precarga selectiva.
 * PreloadAllModules descarga en segundo plano TODOS los chunks lazy, incluidos
 * los protegidos con canMatch (solo respeta canLoad). Así un usuario sin rol
 * acabaría descargando igualmente el código de /admin.
 * Esta estrategia precarga lo público/común y deja fuera las rutas con canMatch:
 * esos chunks solo se descargan si el guard deja pasar.
 */
@Injectable({ providedIn: 'root' })
export class GuardedRoutesPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.canMatch?.length ? of(null) : load();
  }
}
