import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ActivityEvent, ActivityStore, ActivityType } from './activity.store';
import { FirestoreActivityStore } from './firestore-activity.store';
import { LocalActivityStore } from './local-activity.store';

/**
 * Fachada del historial de actividad (segunda fuente de datos).
 * Elige Firestore si hay configuración en `environment.firebase` y, si no,
 * el almacén local. Las páginas solo usan `log()` y `events$`.
 */
@Injectable({ providedIn: 'root' })
export class ActivityService implements OnDestroy {
  private readonly auth = inject(AuthService);

  private readonly store: ActivityStore = environment.firebase.projectId
    ? new FirestoreActivityStore(environment.firebase)
    : new LocalActivityStore();

  readonly sourceLabel = this.store.sourceLabel;
  readonly events$: Observable<ActivityEvent[]> = this.store.events$;

  /** Registra una acción. Si falla (sin red, reglas...) no rompe la pantalla. */
  log(type: ActivityType, detail: string): void {
    const actor = this.auth.user()?.name ?? 'Anónimo';
    this.store.add({ type, actor, detail }).catch(() => undefined);
  }

  ngOnDestroy(): void {
    if (this.store instanceof LocalActivityStore) {
      this.store.destroy();
    }
  }
}
