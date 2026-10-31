import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader,
  IonMenuButton, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';

import { ApiService, Item, Report } from '../../core/services/api.service';
import { ExportService } from '../../core/services/export.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

/** Informes de stock (/informes, supervisor y admin). */
@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatCardComponent, ChartComponent, DataTableComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button aria-label="Abrir menú"></ion-menu-button></ion-buttons>
        <ion-title>Informes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      @if (loading()) {
        <div class="center" role="status"><ion-spinner name="crescent"></ion-spinner> Cargando informe…</div>
      } @else if (error()) {
        <div class="center" role="alert">
          <p>{{ error() }}</p>
          <ion-button (click)="load()">Reintentar</ion-button>
        </div>
      } @else if (report(); as r) {
        <section class="stats" aria-label="Resumen">
          <app-stat-card label="Productos" [value]="r.totalItems" icon="cube-outline" />
          <app-stat-card label="Unidades en stock" [value]="r.totalStock" icon="stats-chart-outline" />
          <app-stat-card label="Sin stock" [value]="r.outOfStock.length" icon="warning-outline"
                         [tone]="r.outOfStock.length ? 'danger' : 'success'"
                         [hint]="r.outOfStock.join(', ')" />
        </section>

        <ion-card>
          <ion-card-header><ion-card-title>Stock por categoría</ion-card-title></ion-card-header>
          <ion-card-content>
            <app-chart type="bar" [labels]="labels()" [series]="series()"
                       ariaLabel="Gráfico de barras con las unidades en stock por categoría"
                       [summary]="summary()" />
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="buttons">
              <ion-button fill="outline" (click)="exportCsv()">Exportar CSV</ion-button>
              <ion-button fill="outline" (click)="exportPdf()">Exportar PDF</ion-button>
            </div>
            <app-data-table caption="Detalle de productos" rowKey="id" [pageSize]="6"
                            [columns]="columns" [rows]="items()" />
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: `
    .center { text-align: center; padding: 24px; }
    .stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  `,
})
export class ReportsPage {
  private readonly api = inject(ApiService);
  private readonly exporter = inject(ExportService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly report = signal<Report | null>(null);
  protected readonly items = signal<Item[]>([]);

  protected readonly columns: TableColumn<Item>[] = [
    { key: 'name', header: 'Producto', sortable: true },
    { key: 'category', header: 'Categoría', sortable: true },
    { key: 'stock', header: 'Stock', sortable: true, align: 'end' },
  ];
  protected readonly labels = computed(() => Object.keys(this.report()?.byCategory ?? {}));
  protected readonly series = computed(() => [{ label: 'Unidades', data: Object.values(this.report()?.byCategory ?? {}) }]);
  protected readonly summary = computed(() =>
    Object.entries(this.report()?.byCategory ?? {}).map(([c, n]) => `${c}: ${n}`).join('; '),
  );

  private readonly exportColumns = [
    { header: 'Producto', value: (i: Item) => i.name },
    { header: 'Categoría', value: (i: Item) => i.category },
    { header: 'Stock', value: (i: Item) => i.stock },
  ];

  ionViewWillEnter(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ report: this.api.getReport(), items: this.api.getItems() }).subscribe({
      next: ({ report, items }) => {
        this.report.set(report);
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el informe. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv('informe-stock.csv', this.exportColumns, this.items());
  }

  protected exportPdf(): void {
    void this.exporter.downloadPdf('informe-stock.pdf', 'Informe de stock', this.exportColumns, this.items());
  }
}
