import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem,
  IonIcon, IonLabel, IonRouterOutlet, IonMenuToggle, IonHeader,
  IonToolbar, IonTitle, IonNote, IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline, statsChartOutline, logOutOutline, personCircleOutline,
  documentTextOutline, shieldCheckmarkOutline, lockClosedOutline, addOutline,
  trashOutline, refreshOutline, warningOutline, menuOutline, cubeOutline,
} from 'ionicons/icons';

import { AuthService } from './core/services/auth.service';
import { ROLE_LABEL } from './core/models/user.model';
import { HasRoleDirective } from './shared/directives/has-role.directive';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink, RouterLinkActive, HasRoleDirective,
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem,
    IonIcon, IonLabel, IonRouterOutlet, IonMenuToggle, IonHeader,
    IonToolbar, IonTitle, IonNote, IonBadge,
  ],
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  });

  constructor() {
    addIcons({
      homeOutline, statsChartOutline, logOutOutline, personCircleOutline,
      documentTextOutline, shieldCheckmarkOutline, lockClosedOutline, addOutline,
      trashOutline, refreshOutline, warningOutline, menuOutline, cubeOutline,
    });
  }

  /** Salta el menú y deja el foco en el contenido principal (WCAG 2.4.1). */
  skipToContent(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main-content');
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  }

  logout(): void {
    this.auth.logout();
  }
}
