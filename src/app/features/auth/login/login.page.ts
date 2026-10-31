import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonInput, IonButton, IonText, IonSpinner, IonChip, IonLabel,
} from '@ionic/angular';
import { ActivityService } from '../../../core/data/activity.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonInput, IonButton, IonText, IonSpinner, IonChip, IonLabel,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activity = inject(ActivityService);

  /** ?returnUrl=/ruta que puso el guard al bloquear el acceso (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  readonly loading = signal(false);

  /**
   * Usuarios de prueba del backend simulado. Solo se rellena el correo: las
   * contraseñas no están en el código (el backend guarda su hash), se entregan
   * aparte en el documento de entrega.
   */
  readonly demoUsers = [
    { label: 'Admin', email: 'admin@demo.com' },
    { label: 'Supervisor', email: 'supervisor@demo.com' },
    { label: 'Usuario', email: 'usuario@demo.com' },
  ];
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: user => {
        this.loading.set(false);
        this.activity.log('login', 'Inició sesión');
        // Vuelve a donde quería ir; si no, a la pantalla de inicio de su rol
        this.router.navigateByUrl(this.safeReturnUrl() ?? this.auth.homeFor(user.role));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo iniciar sesión');
      },
    });
  }

  fillDemo(email: string): void {
    this.form.patchValue({ email });
  }

  /** Solo rutas internas: evita redirecciones abiertas (?returnUrl=https://otro-sitio). */
  private safeReturnUrl(): string | null {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : null;
  }
}