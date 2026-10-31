import { Observable, shareReplay } from 'rxjs';

import { FirebaseConfig } from '../../../environments/firebase.config';
import { ActivityEvent, ActivityStore, NewActivity } from './activity.store';

const COLLECTION = 'activity';

/**
 * Implementación con Cloud Firestore (base de datos NoSQL en tiempo real).
 *
 * - El SDK de Firebase se descarga con `import()` solo cuando se usa, así no
 *   pesa en la carga inicial y, sin configuración, nunca llega a descargarse.
 * - `onSnapshot` mantiene una conexión abierta: Firestore avisa de cada cambio
 *   sin que la app tenga que preguntar. Al cancelar la suscripción se cierra.
 */
export class FirestoreActivityStore extends ActivityStore {
  readonly sourceLabel = 'Firestore (NoSQL en tiempo real)';

  private dbPromise?: Promise<import('firebase/firestore').Firestore>;

  readonly events$: Observable<ActivityEvent[]> = new Observable<ActivityEvent[]>(subscriber => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    this.db()
      .then(async db => {
        const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
        if (cancelled) return;
        const q = query(collection(db, COLLECTION), orderBy('at', 'desc'), limit(50));
        unsubscribe = onSnapshot(
          q,
          snapshot =>
            subscriber.next(
              snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ActivityEvent, 'id'>) })),
            ),
          error => subscriber.error(error),
        );
      })
      .catch(error => subscriber.error(error));

    // Función de limpieza: se ejecuta al desuscribirse
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(private readonly config: FirebaseConfig) {
    super();
  }

  async add(event: NewActivity): Promise<void> {
    const db = await this.db();
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, COLLECTION), { ...event, at: Date.now() });
  }

  private db(): Promise<import('firebase/firestore').Firestore> {
    this.dbPromise ??= (async () => {
      const [{ initializeApp, getApps }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ]);
      const app = getApps()[0] ?? initializeApp(this.config);
      return getFirestore(app);
    })();
    return this.dbPromise;
  }
}
