import { Observable } from 'rxjs';

/** Tipos de evento que se registran en el historial de actividad. */
export type ActivityType = 'login' | 'item_created' | 'item_deleted';

/** Un evento del historial (segunda fuente de datos: NoSQL en tiempo real). */
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  /** Nombre de quien hizo la acción. */
  actor: string;
  detail: string;
  /** Milisegundos desde epoch. */
  at: number;
}

export type NewActivity = Omit<ActivityEvent, 'id' | 'at'>;

/**
 * Contrato de la fuente de datos en tiempo real.
 * Hay dos implementaciones intercambiables (patrón Estrategia):
 *  - FirestoreActivityStore: base de datos NoSQL de Firebase (producción).
 *  - LocalActivityStore: almacén en el navegador, sincronizado entre pestañas.
 * El resto de la app solo conoce esta clase, no sabe cuál se está usando.
 */
export abstract class ActivityStore {
  /** Nombre legible de la fuente, para mostrarlo en pantalla. */
  abstract readonly sourceLabel: string;
  /** Últimos eventos, el más reciente primero. Emite cada vez que algo cambia. */
  abstract readonly events$: Observable<ActivityEvent[]>;
  abstract add(event: NewActivity): Promise<void>;
}
