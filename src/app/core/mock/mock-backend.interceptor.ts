import {
  HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { Observable, delay, from, mergeMap, of, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthTokens, JwtClaims, LoginResponse, Permission, User, UserRole,
} from '../models/user.model';
import { Item } from '../services/api.service';
import { sha256Hex } from '../utils/hash.util';
import { base64UrlEncode, decodeJwt, isTokenExpired } from '../utils/jwt.util';

/**
 * BACKEND SIMULADO
 * ----------------
 * Último interceptor de la cadena: responde en lugar del servidor.
 * Hace lo que haría una API real para que guards e interceptores se puedan
 * probar de verdad: emite JWT con claims, valida el Bearer en cada petición,
 * responde 401 si el token falta/caduca y 403 si falta el permiso.
 * Al tener una API real basta con quitarlo de main.ts (environment.useMockBackend).
 *
 * ⚠ La "firma" es simulada. En un backend real el JWT se firma con una clave
 *   secreta (HS256) o privada (RS256) que NUNCA está en el frontend.
 */

// ---- Datos ficticios --------------------------------------------------------
interface MockUser extends User { passwordHash: string; phone: string; department: string; }

/**
 * Las contraseñas NO están en el código: solo su hash SHA-256 (con sal).
 * Es lo que haría un servidor real con su base de datos. Las contraseñas de
 * prueba se entregan aparte (documento de entrega), nunca en el repositorio.
 */
const PASSWORD_SALT = 'gestion-multiplataforma:';

const USERS: MockUser[] = [
  { id: 1, email: 'admin@demo.com', name: 'Admin Demo', role: 'admin', passwordHash: '2f32bb60fe91232e05184836a10cc1abc0a2d43e9ce2d215d9f30823968152cf', phone: '600 000 001', department: 'Dirección' },
  { id: 2, email: 'supervisor@demo.com', name: 'Supervisor Demo', role: 'supervisor', passwordHash: '0c13463223a0445fe65a0abb757815dd170904cb39497e36e2c4bb6cd1789a29', phone: '600 000 002', department: 'Almacén' },
  { id: 3, email: 'usuario@demo.com', name: 'Usuario Demo', role: 'user', passwordHash: '6c3a6aa78120bac5ee6329093fad7d25416dc26b995ab619463bb32be1795d58', phone: '600 000 003', department: 'Ventas' },
];

/** Matriz rol → permisos (acumulativa: cada rol incluye los del inferior). */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: ['items:read'],
  supervisor: ['items:read', 'items:write', 'reports:read'],
  admin: ['items:read', 'items:write', 'reports:read', 'users:manage'],
};

let nextItemId = 5;
const ITEMS: Item[] = [
  { id: 1, name: 'Portátil 14"', category: 'Informática', stock: 12, createdBy: 'Admin Demo' },
  { id: 2, name: 'Monitor 27"', category: 'Informática', stock: 3, createdBy: 'Supervisor Demo' },
  { id: 3, name: 'Silla ergonómica', category: 'Mobiliario', stock: 8, createdBy: 'Admin Demo' },
  { id: 4, name: 'Teclado mecánico', category: 'Periféricos', stock: 0, createdBy: 'Supervisor Demo' },
];

// ---- "Firma" de tokens ------------------------------------------------------
const MOCK_SIGNATURE = base64UrlEncode('firma-simulada-solo-desarrollo');
const now = () => Math.floor(Date.now() / 1000);

function sign(payload: object): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${base64UrlEncode(JSON.stringify(payload))}.${MOCK_SIGNATURE}`;
}

function issueTokens(user: MockUser): AuthTokens {
  const iat = now();
  const claims: JwtClaims = {
    sub: user.id, email: user.email, name: user.name, role: user.role,
    permissions: ROLE_PERMISSIONS[user.role],
    iat, exp: iat + environment.accessTokenTtlSeconds,
  };
  return {
    accessToken: sign(claims),
    refreshToken: sign({ sub: user.id, type: 'refresh', iat, exp: iat + environment.refreshTokenTtlSeconds }),
  };
}

function verify<T extends { exp: number }>(token: string | null | undefined): T | null {
  if (!token || token.split('.')[2] !== MOCK_SIGNATURE) return null;
  const claims = decodeJwt<T>(token);
  return claims && !isTokenExpired(claims) ? claims : null;
}

// ---- Utilidades de respuesta -----------------------------------------------
const LATENCY_MS = 300;

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));
}

function fail(req: HttpRequest<unknown>, status: number, message: string): Observable<never> {
  const statusText = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found' }[status] ?? 'Error';
  return timer(LATENCY_MS).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, statusText, url: req.url, error: { message } }))),
  );
}

/** Valida el Bearer y el permiso. Devuelve los claims o la respuesta de error. */
function authorize(req: HttpRequest<unknown>, permission?: Permission): JwtClaims | Observable<never> {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return fail(req, 401, 'Falta el token de acceso');

  const claims = verify<JwtClaims>(header.slice('Bearer '.length));
  if (!claims) return fail(req, 401, 'Token inválido o caducado');

  if (permission && !claims.permissions.includes(permission)) {
    return fail(req, 403, `Se requiere el permiso ${permission}`);
  }
  return claims;
}

const isError = (x: JwtClaims | Observable<never>): x is Observable<never> => x instanceof Observable;
const publicUser = ({ passwordHash: _p, phone: _ph, department: _d, ...user }: MockUser): User => user;

// ---- Rutas de la API ---------------------------------------------------------
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const body = (req.body ?? {}) as Record<string, unknown>;

  // POST /auth/login
  if (req.method === 'POST' && path === '/auth/login') {
    return from(sha256Hex(PASSWORD_SALT + String(body['password'] ?? ''))).pipe(
      mergeMap(hash => {
        const user = USERS.find(u => u.email === body['email'] && u.passwordHash === hash);
        if (!user) return fail(req, 401, 'Credenciales incorrectas');
        const response: LoginResponse = { ...issueTokens(user), user: publicUser(user) };
        return ok(response);
      }),
    );
  }

  // POST /auth/refresh
  if (req.method === 'POST' && path === '/auth/refresh') {
    const claims = verify<{ sub: number; type: string; exp: number }>(body['refreshToken'] as string);
    const user = claims?.type === 'refresh' ? USERS.find(u => u.id === claims.sub) : undefined;
    if (!user) return fail(req, 401, 'Refresh token inválido o caducado');
    return ok(issueTokens(user)); // rotación: también se emite un refresh token nuevo
  }

  // GET /items/exists?name=...  (comprobación para el validador asíncrono del alta)
  if (req.method === 'GET' && path === '/items/exists') {
    const auth = authorize(req, 'items:read');
    if (isError(auth)) return auth;
    const name = (req.params.get('name') ?? '').trim().toLowerCase();
    return ok({ exists: ITEMS.some(i => i.name.trim().toLowerCase() === name) });
  }

  // GET /items
  if (req.method === 'GET' && path === '/items') {
    const auth = authorize(req, 'items:read');
    if (isError(auth)) return auth;
    return ok([...ITEMS]);
  }

  // POST /items
  if (req.method === 'POST' && path === '/items') {
    const auth = authorize(req, 'items:write');
    if (isError(auth)) return auth;
    const name = String(body['name'] ?? '').trim();
    if (!name) return fail(req, 400, 'El nombre es obligatorio');
    // El servidor vuelve a comprobarlo: la validación del cliente nunca es suficiente
    if (ITEMS.some(i => i.name.trim().toLowerCase() === name.toLowerCase())) {
      return fail(req, 400, 'Ya existe un producto con ese nombre');
    }
    const item: Item = {
      id: nextItemId++, name,
      category: String(body['category'] ?? 'General'),
      stock: Number(body['stock'] ?? 0),
      createdBy: auth.name,
    };
    ITEMS.push(item);
    return ok(item);
  }

  // DELETE /items/:id  (solo administradores)
  const deleteMatch = /^\/items\/(\d+)$/.exec(path);
  if (req.method === 'DELETE' && deleteMatch) {
    const auth = authorize(req, 'users:manage');
    if (isError(auth)) return auth;
    const index = ITEMS.findIndex(i => i.id === Number(deleteMatch[1]));
    if (index === -1) return fail(req, 404, 'No existe');
    ITEMS.splice(index, 1);
    return ok({ deleted: true });
  }

  // GET /reports
  if (req.method === 'GET' && path === '/reports') {
    const auth = authorize(req, 'reports:read');
    if (isError(auth)) return auth;
    const byCategory = ITEMS.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + i.stock;
      return acc;
    }, {});
    return ok({
      totalItems: ITEMS.length,
      totalStock: ITEMS.reduce((s, i) => s + i.stock, 0),
      outOfStock: ITEMS.filter(i => i.stock === 0).map(i => i.name),
      byCategory,
    });
  }

  // GET /admin/users
  if (req.method === 'GET' && path === '/admin/users') {
    const auth = authorize(req, 'users:manage');
    if (isError(auth)) return auth;
    return ok(USERS.map(u => ({ ...publicUser(u), permissions: ROLE_PERMISSIONS[u.role] })));
  }

  // GET /profile  ·  PUT /profile
  if (path === '/profile' && (req.method === 'GET' || req.method === 'PUT')) {
    const auth = authorize(req);
    if (isError(auth)) return auth;
    const user = USERS.find(u => u.id === auth.sub);
    if (!user) return fail(req, 404, 'Usuario no encontrado');
    if (req.method === 'PUT') {
      user.phone = String(body['phone'] ?? user.phone);
      user.department = String(body['department'] ?? user.department);
    }
    return ok({ name: user.name, email: user.email, phone: user.phone, department: user.department });
  }

  return fail(req, 404, `Ruta no encontrada: ${req.method} ${path}`);
};
