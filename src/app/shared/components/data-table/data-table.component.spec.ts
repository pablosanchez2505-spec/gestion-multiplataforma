import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DataTableComponent, RowAction, TableAction, TableColumn } from './data-table.component';

interface Product { id: number; name: string; stock: number }

const ROWS: Product[] = [
  { id: 1, name: 'Teclado', stock: 5 },
  { id: 2, name: 'Altavoz', stock: 12 },
  { id: 3, name: 'Monitor', stock: 0 },
  { id: 4, name: 'Cable', stock: 40 },
];

@Component({
  imports: [DataTableComponent],
  template: `
    <app-data-table caption="Productos" [columns]="columns" [rows]="rows" [pageSize]="pageSize"
                    [actions]="actions" rowKey="id" (rowAction)="last = $event" />
  `,
})
class HostComponent {
  columns: TableColumn<Product>[] = [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'stock', header: 'Stock', sortable: true, align: 'end' },
  ];
  actions: TableAction[] = [{ id: 'delete', label: 'Eliminar' }];
  rows = ROWS;
  pageSize = 3;
  last: RowAction<Product> | null = null;
}

describe('DataTableComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const names = () => Array.from(el.querySelectorAll('tbody tr td:first-child')).map(td => td.textContent?.trim());
    return { fixture, el, names };
  }

  it('pagina las filas según pageSize', () => {
    const { el, names } = setup();
    expect(names()).toEqual(['Teclado', 'Altavoz', 'Monitor']);
    expect(el.querySelector('.pager span')?.textContent).toContain('Página 1 de 2');
  });

  it('ordena al pulsar la cabecera y marca aria-sort', () => {
    const { fixture, el, names } = setup();
    (el.querySelector('th button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names()).toEqual(['Altavoz', 'Cable', 'Monitor']);
    expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');

    (el.querySelector('th button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names()).toEqual(['Teclado', 'Monitor', 'Cable']);
    expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('descending');
  });

  it('ordena los números como números, no como texto', () => {
    const { fixture, el } = setup();
    (el.querySelectorAll('th button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const stocks = Array.from(el.querySelectorAll('tbody tr td:nth-child(2)')).map(td => td.textContent?.trim());
    expect(stocks).toEqual(['0', '5', '12']);
  });

  it('pasa a la página siguiente', () => {
    const { fixture, el, names } = setup();
    const next = el.querySelectorAll('.pager ion-button')[1] as HTMLElement;
    next.click();
    fixture.detectChanges();
    expect(names()).toEqual(['Cable']);
  });

  it('emite rowAction con la acción y la fila', () => {
    const { fixture, el } = setup();
    (el.querySelector('td.actions ion-button') as HTMLElement).click();
    expect(fixture.componentInstance.last).toEqual({ action: 'delete', row: ROWS[0] });
  });

  it('muestra el aria-label de la acción con el nombre de la fila', () => {
    const { el } = setup();
    expect(el.querySelector('td.actions ion-button')?.getAttribute('aria-label')).toBe('Eliminar: Teclado');
  });
});
