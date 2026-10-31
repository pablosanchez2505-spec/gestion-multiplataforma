// Genera src/environments/firebase.config.ts a partir de variables de entorno.
// Uso:  FIREBASE_API_KEY=... FIREBASE_AUTH_DOMAIN=... FIREBASE_PROJECT_ID=... FIREBASE_APP_ID=... npm run set-env
// Si no hay ninguna variable definida, no toca el archivo (se queda vacío y la app usa el almacén local).
import { writeFileSync } from 'node:fs';

const values = {
  apiKey: process.env.FIREBASE_API_KEY ?? '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.FIREBASE_PROJECT_ID ?? '',
  appId: process.env.FIREBASE_APP_ID ?? '',
};

if (!values.projectId) {
  console.log('set-env: FIREBASE_PROJECT_ID no definido. Se mantiene la configuración vacía (modo local).');
  process.exit(0);
}

const file = `export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export const firebaseConfig: FirebaseConfig = ${JSON.stringify(values, null, 2)};
`;

writeFileSync(new URL('../src/environments/firebase.config.ts', import.meta.url), file);
console.log('set-env: firebase.config.ts generado para el proyecto', values.projectId);
