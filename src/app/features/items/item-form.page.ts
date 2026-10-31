import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSpinner,
  IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { ApiService } from '../../core/services/api.service';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { ItemsStore } from '../../core/state/items.store';
import { itemNameUniqueValidator } from './item-name-unique.validator';

/** Alta de producto (/productos/nuevo): formulario reactivo con validación asíncrona. */
@Component({
  selector: 'app-item-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonInput, IonSpinner,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/productos" text="Atrás"></ion-back-button></ion-buttons>
        <ion-title>Nuevo producto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <ion-input label="Nombre" labelPlacement="floating" fill="outline" formControlName="name"
                   autocomplete="off" required
                   [errorText]="nameError()" [class.ion-invalid]="invalid('name')"
                   [class.ion-touched]="form.controls.name.touched"></ion-input>
        @if (form.controls.name.pending) {
          <p class="hint" role="status"><ion-spinner name="dots"></ion-spinner> Comprobando disponibilidad…</p>
        }

        <ion-input class="gap" label="Categoría" labelPlacement="floating" fill="outline"
                   formControlName="category" required
                   errorText="La categoría es obligatoria"
                   [class.ion-invalid]="invalid('category')"
                   [class.ion-touched]="form.controls.category.touched"></ion-input>

        <ion-input class="gap" label="Stock" labelPlacement="floating" fill="outline" type="number"
                   inputmode="numeric" formControlName="stock" required
                   errorText="Introduce un número entero igual o mayor que 0"
                   [class.ion-invalid]="invalid('stock')"
                   [class.ion-touched]="form.controls.stock.touched"></ion-input>

        <ion-button class="gap" type="submit" expand="block" [disabled]="form.invalid || form.pending || saving()">
          @if (saving()) { <ion-spinner name="crescent"></ion-spinner> } @else { Guardar producto }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: `
    .gap { margin-top: 16px; }
    .hint { font-size: 0.875rem; margin: 4px 0 0; }
  `,
})
export class ItemFormPage implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly store = inject(ItemsStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastController);

  protected readonly saving = signal(false);
  private saved = false;

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(3)],
      asyncValidators: [itemNameUniqueValidator(this.api)],
      updateOn: 'change',
    }),
    category: ['General', Validators.required],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  protected invalid(name: 'name' | 'category' | 'stock'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected nameError(): string {
    const errors = this.form.controls.name.errors;
    if (errors?.['required']) return 'El nombre es obligatorio';
    if (errors?.['minlength']) return 'Mínimo 3 caracteres';
    if (errors?.['nameTaken']) return 'Ya existe un producto con ese nombre';
    return '';
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.store.add(this.form.getRawValue()).subscribe({
      next: async item => {
        this.saved = true;
        this.saving.set(false);
        await (await this.toasts.create({ message: `"${item.name}" creado`, duration: 2000 })).present();
        void this.router.navigateByUrl('/productos');
      },
      error: async () => {
        this.saving.set(false);
        await (await this.toasts.create({ message: 'No se pudo crear el producto', duration: 3000, color: 'danger' })).present();
      },
    });
  }
}
