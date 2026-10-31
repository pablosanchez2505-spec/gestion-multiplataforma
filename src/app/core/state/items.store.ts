import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ActivityService } from '../data/activity.service';
import { ApiService, Item, NewItem } from '../services/api.service';

/**
 * Gestión de estado de los productos (patrón "store" con signals).
 *
 * Un único sitio guarda la lista, el estado de carga y el error. Las páginas
 * no guardan su propia copia: leen estas signals y llaman a los métodos.
 * Si un producto se crea en una pantalla, el resto de pantallas lo ven al
 * instante, sin volver a pedirlo al servidor.
 */
@Injectable({ providedIn: 'root' })
export class ItemsStore {
  private readonly api = inject(ApiService);
  private readonly activity = inject(ActivityService);

  private readonly _items = signal<Item[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Solo lectura desde fuera: el estado solo cambia con los métodos del store
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Estado derivado: se recalcula solo cuando cambia la lista
  readonly categories = computed(() =>
    [...new Set(this._items().map(i => i.category))].sort((a, b) => a.localeCompare(b, 'es')),
  );
  readonly totalStock = computed(() => this._items().reduce((sum, i) => sum + i.stock, 0));
  readonly outOfStock = computed(() => this._items().filter(i => i.stock === 0));

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getItems().subscribe({
      next: items => {
        this._items.set(items);
        this._loading.set(false);
      },
      error: (error: unknown) => {
        this._error.set(this.messageOf(error, 'No se pudieron cargar los productos.'));
        this._loading.set(false);
      },
    });
  }

  add(newItem: NewItem): Observable<Item> {
    return this.api.createItem(newItem).pipe(
      tap(item => {
        this._items.update(list => [...list, item]);
        this.activity.log('item_created', `Creó el producto "${item.name}"`);
      }),
    );
  }

  remove(item: Item): Observable<{ deleted: boolean }> {
    return this.api.deleteItem(item.id).pipe(
      tap(() => {
        this._items.update(list => list.filter(i => i.id !== item.id));
        this.activity.log('item_deleted', `Eliminó el producto "${item.name}"`);
      }),
    );
  }

  private messageOf(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse ? (error.error?.message ?? fallback) : fallback;
  }
}
