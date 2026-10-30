import { Component, inject, signal } from '@angular/core';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
  IonLabel, IonBadge, IonChip, IonSpinner,
} from '@ionic/angular';

import { ROLE_LABEL, UserRole } from '../../core/models/user.model';
import { AdminUser, ApiService } from '../../core/services/api.service';

/** Panel de administración (ruta /admin, solo rol admin). */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonLabel, IonBadge, IonChip, IonSpinner,
  ],
})
export class DashboardPage {
  private readonly api = inject(ApiService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly loading = signal(false);

  ionViewWillEnter(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  roleLabel(role: UserRole): string {
    return ROLE_LABEL[role];
  }

  roleColor(role: UserRole): string {
    return role === 'admin' ? 'danger' : role === 'supervisor' ? 'warning' : 'medium';
  }
}
