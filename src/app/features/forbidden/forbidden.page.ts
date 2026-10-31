import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonText } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';

/** Destino de los 403: el usuario está autenticado pero no autorizado. */
@Component({
  selector: 'app-forbidden',
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Acceso denegado</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-icon name="lock-closed-outline" style="font-size: 64px" color="danger"></ion-icon>
      <h2>403 · No tienes permiso</h2>
      <p><ion-text color="medium">Tu rol no permite acceder a esta sección.</ion-text></p>
      <ion-button [routerLink]="auth.isLoggedIn() ? auth.homeFor() : '/login'">Volver</ion-button>
    </ion-content>
  `,
  imports: [RouterLink, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonText],
})
export class ForbiddenPage {
  protected readonly auth = inject(AuthService);
}
