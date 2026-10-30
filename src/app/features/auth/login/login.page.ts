import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonInput, IonButton, IonText, IonSpinner, IonChip, IonLabel,
} from '@ionic/angular';
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

  /** ?returnUrl=/ruta que puso el guard al bloquear el acceso (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  readonly loading = signal(false);

  /** Usuarios de prueba del backend simulado. */
  readonly demoUsers = [
    { label: 'Admin', email: 'admin@demo.com', password: 'Admin123!' },
    { label: 'Supervisor', email: 'supervisor@demo.com', password: 'Super123!' },
    { label: 'Usuario', email: 'usuario@demo.com', password: 'Usuario123!' },
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
        // Vuelve a donde quería ir; si no, a la pantalla de inicio de su rol
        this.router.navigateByUrl(this.safeReturnUrl() ?? this.auth.homeFor(user.role));
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo iniciar sesión');
      },
    });
  }

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  /** Solo rutas internas: evita redirecciones abiertas (?returnUrl=https://otro-sitio). */
  private safeReturnUrl(): string | null {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : null;
  }
}