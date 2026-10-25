import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem,
  IonIcon, IonLabel, IonRouterOutlet, IonMenuToggle, IonHeader,
  IonToolbar, IonTitle, IonNote,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, statsChartOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink, RouterLinkActive,
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem,
    IonIcon, IonLabel, IonRouterOutlet, IonMenuToggle, IonHeader,
    IonToolbar, IonTitle, IonNote,
  ],
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ homeOutline, statsChartOutline, logOutOutline });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}