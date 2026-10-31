import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

/** Describe una columna: qué propiedad de la fila muestra y cómo. */
export interface TableColumn<T> {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  /** Texto a mostrar si no basta con el valor tal cual (formatos, etiquetas...). */
  format?: (row: T) => string | number;
}

/** Botón de acción por fila (por ejemplo "Eliminar"). */
export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface SortState<T> {
  key: keyof T & string;
  direction: 'asc' | 'desc';
}

export interface RowAction<T> {
  action: string;
  row: T;
}

/**
 * COMPONENTE REUTILIZABLE 2: tabla avanzada (ordenar + paginar + acciones).
 *
 * Es genérico (`T`) y AGNÓSTICO de la vista: no sabe si pinta productos o
 * usuarios. Todo lo que necesita entra por `input()` y todo lo que ocurre sale
 * por `output()`; es la página padre quien decide qué hacer (borrar, abrir...).
 *
 *  Entradas: columns, rows, caption, pageSize, actions, rowKey, emptyText.
 *  Salidas : sortChange, pageChange, rowAction.
 *
 * Accesibilidad: <caption>, cabeceras con scope y aria-sort, botones reales
 * para ordenar (teclado), paginación anunciada con aria-live, y en pantallas
 * estrechas la tabla se transforma en tarjetas (container query, sin JS).
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon],
  template: `
    <div class="wrap" role="region" [attr.aria-label]="caption()" tabindex="0">
      <table>
        <caption>{{ caption() }}</caption>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th scope="col" [class.end]="col.align === 'end'" [attr.aria-sort]="ariaSort(col)">
                @if (col.sortable) {
                  <button type="button" class="sort" (click)="toggleSort(col)">
                    {{ col.header }}<span aria-hidden="true" class="arrow">{{ arrow(col) }}</span>
                  </button>
                } @else {
                  {{ col.header }}
                }
              </th>
            }
            @if (actions().length) {
              <th scope="col"><span class="sr-only">Acciones</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of pagedRows(); track trackRow(row, $index)) {
            <tr>
              @for (col of columns(); track col.key) {
                <td [attr.data-label]="col.header" [class.end]="col.align === 'end'">{{ cell(row, col) }}</td>
              }
              @if (actions().length) {
                <td class="actions">
                  @for (a of actions(); track a.id) {
                    <ion-button size="small" fill="clear" [color]="a.color"
                                [attr.aria-label]="a.label + ': ' + rowLabel(row)"
                                (click)="rowAction.emit({ action: a.id, row: row })">
                      @if (a.icon) { <ion-icon slot="start" [name]="a.icon" aria-hidden="true"></ion-icon> }
                      {{ a.label }}
                    </ion-button>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (!rows().length) {
      <p class="empty" role="status">{{ emptyText() }}</p>
    }

    <nav class="pager" aria-label="Paginación de la tabla">
      <ion-button fill="outline" size="small" [disabled]="currentPage() <= 1"
                  (click)="goTo(currentPage() - 1)">Anterior</ion-button>
      <span aria-live="polite">Página {{ currentPage() }} de {{ pageCount() }} · {{ rows().length }} registros</span>
      <ion-button fill="outline" size="small" [disabled]="currentPage() >= pageCount()"
                  (click)="goTo(currentPage() + 1)">Siguiente</ion-button>
    </nav>
  `,
  styles: `
    :host { display: block; container-type: inline-size; }
    .wrap { overflow-x: auto; border: 1px solid var(--ion-color-step-150, #d7d8da); border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
    caption { text-align: start; padding: 10px 14px; font-weight: 600; }
    th, td { padding: 10px 14px; text-align: start; border-top: 1px solid var(--ion-color-step-150, #d7d8da); }
    th { background: var(--ion-color-step-50, #f2f2f2); font-weight: 600; white-space: nowrap; }
    .end { text-align: end; }
    .sort { all: unset; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
    .sort:focus-visible { outline: 3px solid var(--ion-color-primary); outline-offset: 2px; }
    .arrow { font-size: 0.75rem; min-width: 1ch; }
    .actions { text-align: end; white-space: nowrap; }
    .empty { text-align: center; padding: 16px; color: var(--ion-color-step-650, #595959); }
    .pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding-top: 10px; font-size: 0.875rem; }

    /* Pantalla estrecha: cada fila pasa a ser una tarjeta con "etiqueta: valor" */
    @container (max-width: 560px) {
      thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      tr { display: block; border-top: 1px solid var(--ion-color-step-150, #d7d8da); padding: 6px 0; }
      td { display: flex; justify-content: space-between; gap: 12px; border: 0; padding: 6px 14px; text-align: end; }
      td::before { content: attr(data-label); font-weight: 600; text-align: start; }
      td.actions { justify-content: flex-end; }
      td.actions::before { content: none; }
    }
  `,
})
export class DataTableComponent<T extends object> {
  // ---- Entradas -------------------------------------------------------------
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  /** Título de la tabla: lo leen los lectores de pantalla (obligatorio). */
  readonly caption = input.required<string>();
  readonly pageSize = input(5);
  readonly actions = input<readonly TableAction[]>([]);
  /** Propiedad única de cada fila (por ejemplo `id`), para que Angular no repinte filas que no cambian. */
  readonly rowKey = input<keyof T & string>();
  readonly emptyText = input('No hay datos que mostrar.');

  // ---- Salidas --------------------------------------------------------------
  readonly sortChange = output<SortState<T>>();
  readonly pageChange = output<number>();
  readonly rowAction = output<RowAction<T>>();

  // ---- Estado interno -------------------------------------------------------
  private readonly sort = signal<SortState<T> | null>(null);
  private readonly page = signal(1);

  protected readonly sortedRows = computed(() => {
    const rows = [...this.rows()];
    const sort = this.sort();
    if (!sort) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return rows.sort((a, b) => factor * this.compare(a[sort.key], b[sort.key]));
  });

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));

  /** La página nunca se pasa del final (por ejemplo, tras borrar o filtrar filas). */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));

  protected readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });

  // ---- Acciones de la plantilla --------------------------------------------
  protected toggleSort(col: TableColumn<T>): void {
    const current = this.sort();
    const direction = current?.key === col.key && current.direction === 'asc' ? 'desc' : 'asc';
    const next: SortState<T> = { key: col.key, direction };
    this.sort.set(next);
    this.sortChange.emit(next);
  }

  protected goTo(page: number): void {
    const next = Math.min(Math.max(1, page), this.pageCount());
    this.page.set(next);
    this.pageChange.emit(next);
  }

  protected ariaSort(col: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    const sort = this.sort();
    if (sort?.key !== col.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected arrow(col: TableColumn<T>): string {
    const sort = this.sort();
    return sort?.key === col.key ? (sort.direction === 'asc' ? '▲' : '▼') : '';
  }

  protected cell(row: T, col: TableColumn<T>): string | number {
    return col.format ? col.format(row) : String(row[col.key] ?? '');
  }

  /** Texto que identifica la fila (primera columna): para los aria-label de las acciones. */
  protected rowLabel(row: T): string {
    const first = this.columns()[0];
    return first ? String(this.cell(row, first)) : '';
  }

  protected trackRow(row: T, index: number): unknown {
    const key = this.rowKey();
    return key ? row[key] : index;
  }

  private compare(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' });
  }
}
