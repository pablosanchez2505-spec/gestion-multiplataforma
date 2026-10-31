import { BehaviorSubject, Observable } from 'rxjs';

import { ActivityEvent, ActivityStore, NewActivity } from './activity.store';

const STORAGE_KEY = 'gm_activity';
const CHANNEL_NAME = 'gm-activity';
const MAX_EVENTS = 50;

/**
 * Almacén en tiempo real SIN servidor: guarda el historial en localStorage y
 * avisa a las demás pestañas con BroadcastChannel. Así el panel de
 * administración se actualiza solo cuando otra pestaña (otro usuario simulado)
 * crea o borra un producto. Se usa cuando no hay Firebase configurado.
 */
export class LocalActivityStore extends ActivityStore {
  readonly sourceLabel = 'almacén local (sin Firebase)';

  private readonly subject = new BehaviorSubject<ActivityEvent[]>(this.read());
  private readonly channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  readonly events$: Observable<ActivityEvent[]> = this.subject.asObservable();

  constructor() {
    super();
    // Otra pestaña ha escrito: recargamos desde el almacenamiento
    this.channel?.addEventListener('message', () => this.subject.next(this.read()));
  }

  async add(event: NewActivity): Promise<void> {
    const entry: ActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
    };
    const events = [entry, ...this.read()].slice(0, MAX_EVENTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Almacenamiento lleno o bloqueado: seguimos solo en memoria
    }
    this.subject.next(events);
    this.channel?.postMessage('changed');
  }

  /** Libera el canal (evita fugas de memoria). */
  destroy(): void {
    this.channel?.close();
    this.subject.complete();
  }

  private read(): ActivityEvent[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? (parsed as ActivityEvent[]) : [];
    } catch {
      return [];
    }
  }
}
