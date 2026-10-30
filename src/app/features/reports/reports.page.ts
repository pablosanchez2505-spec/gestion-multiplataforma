import { Component, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonNote, IonSpinner, IonGrid, IonRow, IonCol,
} from '@ionic/angular';

import { ApiService, Report } from '../../core/services/api.service';

/** Informes de stock (ruta /informes, roles supervisor y admin). */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  imports: [
    KeyValuePipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonList, IonItem, IonLabel, IonNote, IonSpinner, IonGrid, IonRow, IonCol,
  ],
})
export class ReportsPage {
  private readonly api = inject(ApiService);

  protected readonly report = signal<Report | null>(null);

  ionViewWillEnter(): void {
    this.api.getReport().subscribe(r => this.report.set(r));
  }
}
