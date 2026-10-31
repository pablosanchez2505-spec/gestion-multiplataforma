import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ApiService } from '../../core/services/api.service';
import { itemNameUniqueValidator } from './item-name-unique.validator';

function apiReturning(result: ReturnType<ApiService['itemNameExists']>): ApiService {
  return { itemNameExists: vi.fn(() => result) } as unknown as ApiService;
}

describe('itemNameUniqueValidator', () => {
  it('no consulta al servidor si el campo está vacío', async () => {
    const api = apiReturning(of(true));
    const result = await new Promise(resolve =>
      (itemNameUniqueValidator(api, 0)(new FormControl('  ')) as Observable<unknown>).subscribe(resolve),
    );
    expect(result).toBeNull();
    expect(api.itemNameExists).not.toHaveBeenCalled();
  });

  it('devuelve { nameTaken } si el nombre ya existe', async () => {
    const api = apiReturning(of(true));
    const result = await new Promise(resolve =>
      (itemNameUniqueValidator(api, 0)(new FormControl('Monitor 27"')) as Observable<unknown>).subscribe(resolve),
    );
    expect(result).toEqual({ nameTaken: true });
    expect(api.itemNameExists).toHaveBeenCalledWith('Monitor 27"');
  });

  it('devuelve null si el nombre está libre', async () => {
    const api = apiReturning(of(false));
    const result = await new Promise(resolve =>
      (itemNameUniqueValidator(api, 0)(new FormControl('Ratón')) as Observable<unknown>).subscribe(resolve),
    );
    expect(result).toBeNull();
  });

  it('si el servidor falla, no bloquea el formulario', async () => {
    const api = apiReturning(throwError(() => new Error('sin red')));
    const result = await new Promise(resolve =>
      (itemNameUniqueValidator(api, 0)(new FormControl('Ratón')) as Observable<unknown>).subscribe(resolve),
    );
    expect(result).toBeNull();
  });
});
