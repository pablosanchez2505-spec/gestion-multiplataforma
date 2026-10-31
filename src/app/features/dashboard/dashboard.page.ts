import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader,
  IonItem, IonLabel, IonList, IonMenuButton, IonSearchbar, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';

import { ActivityService } from '../../core/data/activity.service';
import { ROLE_LABEL } from '../../core/models/user.model';
import { AdminUser, ApiService, Item, Report } from '../../core/services/api.service';
import { ExportService } from '../../core/services/export.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

interface UserRow { id: number; name: string; email: string; role: string; permissions: string; }

/**
 * Panel de administración (/admin, solo admin).
 * Fuente 1 (REST): productos, informe y usuarios, cargados en paralelo con forkJoin.
 * Fuente 2 (Firestore o local): actividad en tiempo real.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, StatCardComponent, ChartComponent, DataTableComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
    IonSearchbar, IonSpinner,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button aria-label="Abrir menú"></ion-menu-button></ion-buttons>
        <ion-title>Administración</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      @if (loading()) {
        <div class="center" role="status"><ion-spinner name="crescent"></ion-spinner> Cargando panel…</div>
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
                         [tone]="r.outOfStock.length ? 'danger' : 'success'" />
          <app-stat-card label="Usuarios" [value]="users().length" icon="person-circle-outline" />
        </section>

        <div class="charts">
          <ion-card>
            <ion-card-header><ion-card-title>Stock por categoría</ion-card-title></ion-card-header>
            <ion-card-content>
              <app-chart type="bar" [labels]="categoryLabels()" [series]="categorySeries()"
                         ariaLabel="Gráfico de barras con las unidades en stock por categoría"
                         [summary]="categorySummary()" />
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header><ion-card-title>Usuarios por rol</ion-card-title></ion-card-header>
            <ion-card-content>
              <app-chart type="doughnut" [labels]="roleLabels()" [series]="roleSeries()"
                         ariaLabel="Gráfico circular con el número de usuarios por rol"
                         [summary]="roleSummary()" />
            </ion-card-content>
          </ion-card>
        </div>

        <ion-card>
          <ion-card-content>
            <div class="buttons">
              <ion-button fill="outline" (click)="exportCsv()">Exportar usuarios CSV</ion-button>
              <ion-button fill="outline" (click)="exportPdf()">Exportar usuarios PDF</ion-button>
            </div>
            <app-data-table caption="Usuarios, roles y permisos" rowKey="id" [pageSize]="5"
                            [columns]="userColumns" [rows]="userRows()" />
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Actividad en tiempo real</ion-card-title>
            <p class="source">Fuente: {{ source }}</p>
          </ion-card-header>
          <ion-card-content>
            <ion-searchbar label="Filtrar actividad" labelPlacement="floating"
                           placeholder="Usuario o acción" [(ngModel)]="activityFilter"></ion-searchbar>
            <ion-list aria-live="polite" aria-label="Últimas acciones">
              @for (e of filteredActivity(); track e.id) {
                <ion-item>
                  <ion-label class="ion-text-wrap">
                    <h3>{{ e.actor }}</h3>
                    <p>{{ e.detail }}</p>
                    <p><time [attr.datetime]="e.at">{{ e.at | date: 'dd/MM/yyyy HH:mm:ss' }}</time></p>
                  </ion-label>
                </ion-item>
              } @empty {
                <ion-item><ion-label>No hay actividad que mostrar.</ion-label></ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: `
    .center { text-align: center; padding: 24px; }
    .stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 8px; }
    .charts { display: grid; gap: 0 12px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .source { margin: 4px 16px 0 0; font-size: 0.875rem; }
  `,
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly activity = inject(ActivityService);
  private readonly exporter = inject(ExportService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<Item[]>([]);
  protected readonly report = signal<Report | null>(null);
  protected readonly users = signal<AdminUser[]>([]);

  protected readonly source = this.activity.sourceLabel;
  protected readonly activityFilter = signal('');
  private readonly events = toSignal(this.activity.events$, { initialValue: [] });
  protected readonly filteredActivity = computed(() => {
    const text = this.activityFilter().trim().toLowerCase();
    return this.events().filter(e => !text || `${e.actor} ${e.detail}`.toLowerCase().includes(text));
  });

  protected readonly userColumns: TableColumn<UserRow>[] = [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'email', header: 'Correo', sortable: true },
    { key: 'role', header: 'Rol', sortable: true },
    { key: 'permissions', header: 'Permisos' },
  ];
  protected readonly userRows = computed<UserRow[]>(() =>
    this.users().map(u => ({
      id: u.id, name: u.name, email: u.email, role: ROLE_LABEL[u.role], permissions: u.permissions.join(', '),
    })),
  );

  protected readonly categoryLabels = computed(() => Object.keys(this.report()?.byCategory ?? {}));
  protected readonly categorySeries = computed(() => [
    { label: 'Unidades', data: Object.values(this.report()?.byCategory ?? {}) },
  ]);
  protected readonly categorySummary = computed(() =>
    Object.entries(this.report()?.byCategory ?? {}).map(([c, n]) => `${c}: ${n}`).join('; '),
  );

  private readonly roleCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const u of this.users()) counts[ROLE_LABEL[u.role]] = (counts[ROLE_LABEL[u.role]] ?? 0) + 1;
    return counts;
  });
  protected readonly roleLabels = computed(() => Object.keys(this.roleCounts()));
  protected readonly roleSeries = computed(() => [{ label: 'Usuarios', data: Object.values(this.roleCounts()) }]);
  protected readonly roleSummary = computed(() =>
    Object.entries(this.roleCounts()).map(([r, n]) => `${r}: ${n}`).join('; '),
  );

  private readonly exportColumns = [
    { header: 'Nombre', value: (u: UserRow) => u.name },
    { header: 'Correo', value: (u: UserRow) => u.email },
    { header: 'Rol', value: (u: UserRow) => u.role },
    { header: 'Permisos', value: (u: UserRow) => u.permissions },
  ];

  ionViewWillEnter(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    // forkJoin lanza las tres peticiones a la vez y espera a que terminen todas
    forkJoin({
      items: this.api.getItems(),
      report: this.api.getReport(),
      users: this.api.getUsers(),
    }).subscribe({
      next: ({ items, report, users }) => {
        this.items.set(items);
        this.report.set(report);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el panel. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv('usuarios.csv', this.exportColumns, this.userRows());
  }

  protected exportPdf(): void {
    void this.exporter.downloadPdf('usuarios.pdf', 'Usuarios y permisos', this.exportColumns, this.userRows());
  }
}
