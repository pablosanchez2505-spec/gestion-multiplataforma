# Gestión Multiplataforma

Aplicación de gestión de productos (PWA / híbrida) hecha con **Ionic 9 + Angular 22** para la actividad individual DI 0488.
Incluye roles (usuario, supervisor, administrador), guards, interceptores JWT, formularios reactivos con validación asíncrona,
componentes reutilizables, dos fuentes de datos (API REST simulada + Firestore en tiempo real), dashboard con gráficos,
exportación a CSV/PDF, accesibilidad y CI/CD.

## Enlaces

- Repositorio: https://github.com/pablosanchez2505-spec/gestion-multiplataforma
- Producción (Vercel): https://gestion-multiplataforma.vercel.app
- Documentación técnica (Compodoc): https://pablosanchez2505-spec.github.io/gestion-multiplataforma/

## Instalación y uso

```bash
npm install
npm start          # http://localhost:4200
npm test           # tests unitarios (Vitest)
npm run lint
npm run build      # compilación de producción en www/
npm run docs       # documentación técnica (Compodoc) en docs/ (se publica con GitHub Pages)
```

## Usuarios de prueba (datos sintéticos)

| Rol | Correo |
|---|---|
| Administrador | admin@demo.com |
| Supervisor | supervisor@demo.com |
| Usuario | usuario@demo.com |

Las contraseñas **no** se publican en el repositorio (el backend simulado solo guarda su hash SHA-256).
Constan en el PDF de entrega. En la pantalla de login, pulsar un usuario rellena el correo.

## Arquitectura

```
src/app
├── core/        servicios, guards, interceptores, modelos, store de productos, acceso a datos
│   ├── data/    ActivityService: Firestore (tiempo real) con respaldo local (Strategy)
│   ├── mock/    backend REST simulado (interceptor)
│   └── state/   ItemsStore (signals)
├── features/    páginas en lazy loading: auth, home, items, reports, dashboard (admin), profile
└── shared/      componentes reutilizables (stat-card, data-table, chart) y directivas
```

- **Roles y permisos:** `user < supervisor < admin`, con permisos `items:read`, `items:write`, `reports:read`, `users:manage` incluidos en el JWT.
- **Guards:** `authGuard`, `guestGuard`, `roleGuard`, `permissionGuard` (canMatch) y `unsavedChangesGuard` (canDeactivate).
- **Interceptores:** añaden el token, renuevan con refresh token ante un 401 y redirigen a `/forbidden` ante un 403.
- **Componentes reutilizables (OnPush, `input()`/`output()`):** `app-stat-card`, `app-data-table`, `app-chart`.
- **Datos:** REST simulado (productos, informes, usuarios) + historial de actividad en Firestore. Sin configuración de Firebase se usa un almacén local sincronizado entre pestañas.

## Firebase (opcional)

No se guardan claves en el repositorio. Para activar Firestore se definen estas variables de entorno antes de compilar:
`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` y se ejecuta `npm run set-env`.
Las reglas están en `firestore.rules`. En Vercel las mismas cuatro variables se añaden en Settings > Environment Variables
(el `buildCommand` de `vercel.json` ejecuta `npm run set-env` antes de compilar).

## Manual de usuario

1. **Iniciar sesión** con un usuario de prueba.
2. **Productos:** buscar, filtrar por categoría, ordenar columnas, paginar y exportar a CSV/PDF. Supervisor y admin pueden crear productos; solo el admin puede eliminarlos.
3. **Informes** (supervisor/admin): resumen de stock, gráfico por categoría y exportación.
4. **Administración** (admin): resumen, gráficos, tabla de usuarios y actividad en tiempo real.
5. **Mi perfil:** editar datos; si hay cambios sin guardar se pide confirmación al salir.

## Flujo Git (Git Flow)

`main` (producción) ← `develop` ← `feature/*`. Cada funcionalidad va en su rama y se integra con Pull Request.

## CI/CD

`.github/workflows/ci.yml`: en cada push/PR ejecuta lint, tests y build. El job de **despliegue en Vercel depende del de tests** (`needs: test`)
y solo se ejecuta en `main`: si un test falla no se despliega. Secrets necesarios en GitHub: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
`VERCEL_PROJECT_ID` y, opcionalmente, los `FIREBASE_*`.

## Accesibilidad y rendimiento

Enlace "Saltar al contenido", foco visible, `aria-label`/`aria-sort`/`aria-live`, tablas semánticas, gráficos con alternativa textual,
respeto de `prefers-reduced-motion`, `lang="es"`, PWA con service worker y manifiesto. Informe Lighthouse en el PDF de entrega
(`npx lighthouse <url> --view`).
