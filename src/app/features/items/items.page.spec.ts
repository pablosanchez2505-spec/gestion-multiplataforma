import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ItemsStore } from '../../core/state/items.store';
import { ItemsPage } from './items.page';

describe('ItemsPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] }));

  it('se crea con [(ngModel)] sin errores de formulario', () => {
    const fixture = TestBed.createComponent(ItemsPage);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('filtra por texto', () => {
    const fixture = TestBed.createComponent(ItemsPage);
    const store = TestBed.inject(ItemsStore);
    vi.spyOn(store, 'load').mockImplementation(() => undefined);
    fixture.detectChanges();
    (store as unknown as { _items: { set(v: unknown[]): void } })._items.set([
      { id: 1, name: 'Teclado', category: 'Periféricos', stock: 3, createdBy: 'a' },
      { id: 2, name: 'Monitor', category: 'Pantallas', stock: 0, createdBy: 'a' },
    ]);
    const page = fixture.componentInstance as unknown as { search: { set(v: string): void }; filtered(): unknown[] };
    page.search.set('mon');
    expect(page.filtered().length).toBe(1);
  });
});
