import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  computed, effect, input, signal, viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

/** Paleta con buen contraste y distinguible para daltonismo. */
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4d7c0f'];

export interface ChartSeries {
  label: string;
  data: readonly number[];
}

/**
 * COMPONENTE REUTILIZABLE 3: gráfico (envoltorio de Chart.js).
 *
 * Chart.js trabaja con un <canvas> y objetos que hay que crear y destruir a
 * mano. Este componente esconde esa complejidad y ofrece una API declarativa:
 * le pasas tipo, etiquetas y series por `input()` y se dibuja y actualiza solo.
 *
 * CICLO DE VIDA (importante para no dejar fugas de memoria):
 *  - ngAfterViewInit: el <canvas> ya existe → se puede crear el gráfico.
 *  - effect():        si cambian los datos, se actualiza el gráfico existente.
 *  - ngOnDestroy:     se destruye el gráfico (libera el canvas y sus listeners).
 *
 * Accesibilidad: un canvas es una imagen, así que lleva role="img",
 * aria-label y un resumen en texto (`summary`) para lectores de pantalla.
 */
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <div class="box">
        <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
      </div>
      @if (summary()) {
        <figcaption class="sr-only">{{ summary() }}</figcaption>
      }
    </figure>
  `,
  styles: `
    :host { display: block; }
    figure { margin: 0; }
    .box { position: relative; width: 100%; height: 260px; }
  `,
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  readonly type = input<ChartType>('bar');
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly title = input('');
  /** Descripción corta del gráfico para lectores de pantalla (obligatoria). */
  readonly ariaLabel = input.required<string>();
  /** Resumen de los datos en texto (alternativa textual al gráfico). */
  readonly summary = input('');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewReady = signal(false);
  private chart?: Chart;

  private readonly config = computed<ChartConfiguration>(() => {
    const type = this.type();
    const circular = type === 'doughnut' || type === 'pie';
    return {
      type,
      data: {
        labels: [...this.labels()],
        datasets: this.series().map((s, i) => ({
          label: s.label,
          data: [...s.data],
          // Circulares y series únicas: un color por dato; varias series: un color por serie
          backgroundColor: circular || this.series().length === 1
            ? this.labels().map((_, j) => PALETTE[j % PALETTE.length])
            : PALETTE[i % PALETTE.length],
          borderColor: type === 'line' ? PALETTE[i % PALETTE.length] : undefined,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.prefersReducedMotion() ? false : undefined,
        plugins: {
          legend: { display: circular || this.series().length > 1 },
          title: { display: !!this.title(), text: this.title() },
        },
        scales: circular ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  });

  constructor() {
    // Reacciona a los cambios de datos una vez que la vista existe
    effect(() => {
      const config = this.config();
      if (!this.viewReady()) return;
      this.render(config);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  private render(config: ChartConfiguration): void {
    if (this.chart) {
      this.chart.data = config.data;
      this.chart.options = config.options ?? {};
      this.chart.update();
      return;
    }
    const context = this.canvas().nativeElement.getContext('2d');
    if (!context) return; // entornos sin canvas (tests en jsdom)

    Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--ion-text-color').trim() || '#222';
    this.chart = new Chart(context, config);
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
