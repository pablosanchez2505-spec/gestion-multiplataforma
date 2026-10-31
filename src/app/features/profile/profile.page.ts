import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonInput, IonButton, IonList, IonItem, IonLabel, IonText, ToastController,
} from '@ionic/angular';

import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { ApiService, Profile } from '../../core/services/api.service';

/**
 * Perfil del usuario (ruta /perfil).
 * Implementa HasUnsavedChanges → unsavedChangesGuard (canDeactivate) pide
 * confirmación si se intenta salir con el formulario modificado.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  imports: [
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonInput, IonButton, IonList, IonItem, IonLabel, IonText,
  ],
})
export class ProfilePage implements HasUnsavedChanges {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toastCtrl = inject(ToastController);

  protected readonly profile = signal<Profile | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^[0-9 +]{9,15}$/)]],
    department: ['', Validators.required],
  });

  ionViewWillEnter(): void {
    this.api.getProfile().subscribe(p => {
      this.profile.set(p);
      this.form.reset({ phone: p.phone, department: p.department });
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.updateProfile(this.form.getRawValue()).subscribe({
      next: async p => {
        this.profile.set(p);
        this.form.reset({ phone: p.phone, department: p.department }); // vuelve a "pristine"
        this.saving.set(false);
        const toast = await this.toastCtrl.create({ message: 'Perfil guardado', duration: 1500, color: 'success' });
        await toast.present();
      },
      error: () => this.saving.set(false),
    });
  }
}
