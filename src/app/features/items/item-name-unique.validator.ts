import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';

import { ApiService } from '../../core/services/api.service';

/**
 * Validador ASÍNCRONO: el nombre del producto no puede estar repetido.
 *
 * - Un validador síncrono responde al instante; este tiene que preguntar al
 *   servidor, así que devuelve un Observable. Mientras espera, el control
 *   queda en estado `pending`.
 * - `timer(debounceMs)` + `switchMap` = debounce: si el usuario sigue
 *   escribiendo, la comprobación anterior se cancela y solo se hace la última
 *   (una petición por pausa, no por tecla).
 * - Si el servidor falla, `catchError` deja pasar el valor: el servidor
 *   volverá a comprobarlo al guardar, y el formulario no se queda bloqueado.
 */
export function itemNameUniqueValidator(api: ApiService, debounceMs = 400): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const name = String(control.value ?? '').trim();
    if (!name) {
      return of(null);
    }
    return timer(debounceMs).pipe(
      switchMap(() => api.itemNameExists(name)),
      map(exists => (exists ? { nameTaken: true } : null)),
      catchError(() => of(null)),
    );
  };
}
