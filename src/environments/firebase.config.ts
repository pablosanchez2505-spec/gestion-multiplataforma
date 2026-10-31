/**
 * Configuración de Firebase (Firestore) para la segunda fuente de datos.
 *
 * Este archivo se sube VACÍO a propósito: sin `projectId` la app usa un almacén
 * local en tiempo real (LocalActivityStore) y funciona igual, sin Firebase.
 *
 * Para activar Firestore:
 *  - En local: rellena los cuatro valores (o ejecuta `npm run set-env` con las
 *    variables FIREBASE_* definidas). NO subas valores reales a un repo público.
 *  - En CI/despliegue: define los secretos FIREBASE_* y el flujo de trabajo
 *    ejecuta `npm run set-env` antes de compilar.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};
