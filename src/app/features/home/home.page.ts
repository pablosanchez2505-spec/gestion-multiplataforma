import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonChip, IonLabel, IonList, IonItem, IonNote, IonButton, IonIcon,
  IonInput, IonSpinner, IonText, IonBadge,
} from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { ROLE_LABEL } from '../../core/models/user.model';
import { ApiService, Item } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { HasPermissionDirective, HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    ReactiveFormsModule, HasRoleDirective, HasPermissionDirective,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonChip, IonLabel, IonList, IonItem, IonNote, IonButton, IonIcon,
    IonInput, IonSpinner, IonText, IonBadge,
  ],
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly showDemoTools = environment.useMockBackend;
  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(false);
  protected readonly demoLog = signal<string | null>(null);

  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  });
  protected readonly permissionList = computed(() => [...this.auth.permissions()]);
  protected readonly tokenExpiresAt = computed(() => {
    const exp = this.auth.claims()?.exp;
    return exp ? new Date(exp * 1000).toLocaleTimeString() : '-';
  });

  protected readonly newItemForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['General'],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  /** Ionic reutiliza la página: recargamos cada vez que se entra en ella. */
  ionViewWillEnter(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.api.getItems().subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  addItem(): void {
    if (this.newItemForm.invalid) return;
    this.api.createItem(this.newItemForm.getRawValue()).subscribe(item => {
      this.items.update(list => [...list, item]);
      this.newItemForm.reset({ name: '', category: 'General', stock: 0 });
    });
  }

  deleteItem(id: number): void {
    this.api.deleteItem(id).subscribe(() => this.items.update(list => list.filter(i => i.id !== id)));
  }

  // ---- Demo de los interceptores ------------------------------------------
  /** Caduca el access token y lanza una petición: 401 → refresh → reintento automático. */
  testRefresh(): void {
    const before = this.tokenExpiresAt();
    this.auth.simulateExpiredAccessToken();
    this.demoLog.set('Token caducado. Pidiendo /items…');
    this.api.getItems().subscribe({
      next: items => {
        this.items.set(items);
        this.demoLog.set(`OK: el interceptor recibió 401, renovó el token y reintentó. Caducidad: ${before} → ${this.tokenExpiresAt()}`);
      },
      error: () => this.demoLog.set('El refresh falló: sesión cerrada.'),
    });
  }

  /** Llama a un endpoint de admin. Sin permiso → 403 → el interceptor manda a /forbidden. */
  testForbidden(): void {
    this.demoLog.set('Llamando a /admin/users…');
    this.api.probeAdminEndpoint().subscribe({
      next: users => this.demoLog.set(`OK (eres admin): ${users.length} usuarios.`),
      error: () => this.demoLog.set(null),
    });
  }
}
