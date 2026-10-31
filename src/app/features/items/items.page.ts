import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AlertController, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton,
  IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { Item } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { ItemsStore } from '../../core/state/items.store';
import {
  DataTableComponent, RowAction, TableAction, TableColumn,
} from '../../shared/components/data-table/data-table.component';
import { HasPermissionDirective } from '../../shared/directives/has-role.directive';

/** Listado de productos (/productos): buscar, filtrar, ordenar, paginar, borrar y exportar. */
@Component({
  selector: 'app-items',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterLink, HasPermissionDirective, DataTableComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon,
    IonSearchbar, IonSelect, IonSelectOption, IonSpinner,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button aria-label="Abrir menú"></ion-menu-button></ion-buttons>
        <ion-title>Productos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="toolbar">
        <ion-searchbar label="Buscar producto" labelPlacement="floating" placeholder="Nombre o categoría"
                       [ngModel]="search()" (ngModelChange)="search.set($event ?? '')"></ion-searchbar>
        <ion-select label="Categoría" labelPlacement="floating" interface="popover"
                    [ngModel]="category()" (ngModelChange)="category.set($event ?? '')">
          <ion-select-option value="">Todas</ion-select-option>
          @for (c of store.categories(); track c) {
            <ion-select-option [value]="c">{{ c }}</ion-select-option>
          }
        </ion-select>
      </div>

      <div class="buttons">
        <ion-button *appHasPermission="'items:write'" routerLink="/productos/nuevo">
          <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Nuevo producto
        </ion-button>
        <ion-button fill="outline" (click)="exportCsv()" [disabled]="!filtered().length">Exportar CSV</ion-button>
        <ion-button fill="outline" (click)="exportPdf()" [disabled]="!filtered().length">Exportar PDF</ion-button>
      </div>

      @if (store.loading()) {
        <div class="center" role="status"><ion-spinner name="crescent"></ion-spinner> Cargando productos…</div>
      } @else if (store.error(); as error) {
        <div class="center" role="alert">
          <p>{{ error }}</p>
          <ion-button (click)="store.load()">Reintentar</ion-button>
        </div>
      } @else {
        <app-data-table caption="Listado de productos" rowKey="id" [pageSize]="6"
                        [columns]="columns" [rows]="filtered()" [actions]="actions()"
                        emptyText="No hay productos que coincidan con el filtro."
                        (rowAction)="onRowAction($event)" />
      }
    </ion-content>
  `,
  styles: `
    .toolbar { display: grid; gap: 8px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .toolbar { grid-template-columns: 2fr 1fr; align-items: center; } }
    .buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; }
    .center { text-align: center; padding: 24px; }
  `,
})
export class ItemsPage {
  protected readonly store = inject(ItemsStore);
  private readonly auth = inject(AuthService);
  private readonly exporter = inject(ExportService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);

  protected readonly search = signal('');
  protected readonly category = signal('');

  protected readonly columns: TableColumn<Item>[] = [
    { key: 'name', header: 'Producto', sortable: true },
    { key: 'category', header: 'Categoría', sortable: true },
    { key: 'stock', header: 'Stock', sortable: true, align: 'end' },
    { key: 'createdBy', header: 'Creado por' },
  ];

  protected readonly filtered = computed(() => {
    const text = this.search().trim().toLowerCase();
    const category = this.category();
    return this.store.items().filter(item =>
      (!category || item.category === category) &&
      (!text || item.name.toLowerCase().includes(text) || item.category.toLowerCase().includes(text)),
    );
  });

  /** Solo quien tiene el permiso users:manage ve el botón de eliminar. */
  protected readonly actions = computed<TableAction[]>(() =>
    this.auth.hasPermission('users:manage') ? [{ id: 'delete', label: 'Eliminar', color: 'danger' }] : [],
  );

  private readonly exportColumns = [
    { header: 'ID', value: (i: Item) => i.id },
    { header: 'Producto', value: (i: Item) => i.name },
    { header: 'Categoría', value: (i: Item) => i.category },
    { header: 'Stock', value: (i: Item) => i.stock },
  ];

  ionViewWillEnter(): void {
    this.store.load();
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv('productos.csv', this.exportColumns, this.filtered());
  }

  protected exportPdf(): void {
    void this.exporter.downloadPdf('productos.pdf', 'Listado de productos', this.exportColumns, this.filtered());
  }

  protected async onRowAction(event: RowAction<Item>): Promise<void> {
    if (event.action !== 'delete') return;
    const alert = await this.alerts.create({
      header: 'Eliminar producto',
      message: `¿Seguro que quieres eliminar "${event.row.name}"?`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'confirm' }],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    this.store.remove(event.row).subscribe({
      next: async () => (await this.toasts.create({ message: 'Producto eliminado', duration: 2000 })).present(),
      error: async () => (await this.toasts.create({ message: 'No se pudo eliminar', duration: 3000, color: 'danger' })).present(),
    });
  }
}
