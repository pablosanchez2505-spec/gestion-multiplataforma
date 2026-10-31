import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger';
export type StatTrend = 'up' | 'down' | 'flat';

const TREND_TEXT: Record<StatTrend, string> = { up: 'sube', down: 'baja', flat: 'estable' };
const TREND_ICON: Record<StatTrend, string> = {
  up: 'trending-up-outline',
  down: 'trending-down-outline',
  flat: 'remove-outline',
};

/**
 * COMPONENTE REUTILIZABLE 1: tarjeta estadística (widget de un dato clave).
 *
 * Es "tonto" a propósito: no sabe de dónde vienen los datos ni qué significan.
 *  - Recibe todo por `input()` (etiqueta, valor, icono, tendencia...).
 *  - Avisa al padre con `output()` cuando se pulsa (solo si es clicable).
 * Así sirve igual para productos, usuarios o cualquier otra métrica.
 *
 * Los iconos se registran una vez con `addIcons()` en quien los usa.
 * OnPush: solo se repinta si cambia alguno de sus inputs (más rendimiento).
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, NgTemplateOutlet],
  template: `
    @if (clickable()) {
      <button type="button" class="card" [class]="cardClass()" (click)="selected.emit()">
        <ng-container [ngTemplateOutlet]="body" />
      </button>
    } @else {
      <div class="card" [class]="cardClass()">
        <ng-container [ngTemplateOutlet]="body" />
      </div>
    }

    <ng-template #body>
      @if (icon()) {
        <ion-icon class="icon" [name]="icon()" aria-hidden="true"></ion-icon>
      }
      <span class="label">{{ label() }}</span>
      <span class="value">{{ value() }}</span>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
      @if (trend(); as t) {
        <span class="trend">
          <ion-icon [name]="trendIcon()" aria-hidden="true"></ion-icon>
          <span class="sr-only">Tendencia: {{ trendText() }}</span>
        </span>
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; }
    .card {
      position: relative; display: flex; flex-direction: column; gap: 2px; width: 100%;
      padding: 14px 16px; text-align: start; font: inherit; color: var(--ion-text-color);
      background: var(--ion-card-background, var(--ion-background-color));
      border: 1px solid var(--ion-color-step-150, #d7d8da);
      border-inline-start: 5px solid var(--tone);
      border-radius: 10px;
    }
    button.card { cursor: pointer; }
    button.card:hover { background: var(--ion-color-step-50, #f2f2f2); }
    .tone-primary { --tone: var(--ion-color-primary); }
    .tone-success { --tone: var(--ion-color-success); }
    .tone-warning { --tone: var(--ion-color-warning); }
    .tone-danger { --tone: var(--ion-color-danger); }
    .icon { position: absolute; inset-block-start: 12px; inset-inline-end: 14px; font-size: 1.5rem; color: var(--tone); }
    .label { font-size: 0.875rem; color: var(--ion-color-step-650, #595959); }
    .value { font-size: 1.75rem; font-weight: 700; line-height: 1.2; }
    .hint { font-size: 0.8125rem; color: var(--ion-color-step-650, #595959); }
    .trend { font-size: 1.125rem; color: var(--tone); }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>();
  readonly hint = input<string>();
  readonly trend = input<StatTrend>();
  readonly tone = input<StatTone>('primary');
  readonly clickable = input(false);

  /** Se emite al pulsar la tarjeta (solo si `clickable` es true). */
  readonly selected = output<void>();

  protected readonly cardClass = computed(() => `card tone-${this.tone()}`);
  protected readonly trendIcon = computed(() => TREND_ICON[this.trend() ?? 'flat']);
  protected readonly trendText = computed(() => TREND_TEXT[this.trend() ?? 'flat']);
}
