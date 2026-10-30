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
  trashOutline, refreshOutline, warningOutline, menuOutline,
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
      trashOutline, refreshOutline, warningOutline, menuOutline,
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
