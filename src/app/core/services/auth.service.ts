import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../interceptors/http-context.tokens';
import {
  AuthTokens, JwtClaims, LoginResponse, Permission, ROLE_LEVEL, User, UserRole,
} from '../models/user.model';
import { base64UrlEncode, decodeJwt, isTokenExpired } from '../utils/jwt.util';

const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

/**
 * Servicio centralizado de estado de sesión.
 * - Única fuente de verdad: los tokens. Usuario, rol y permisos son signals
 *   computadas a partir de los claims del access token (no se duplican).
 * - Guards, interceptores y directivas consultan este servicio; ninguno lee
 *   localStorage ni decodifica el JWT por su cuenta (desacoplamiento).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;
  private readonly skipAuth = { context: new HttpContext().set(SKIP_AUTH, true) };

  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));

  /** Refresh en curso compartido: si llegan varios 401 a la vez, solo se hace UNA llamada. */
  private refreshInFlight$: Observable<string> | null = null;

  // ---- Estado derivado (signals) -------------------------------------------
  readonly claims = computed(() => decodeJwt<JwtClaims>(this._accessToken()));

  readonly user = computed<User | null>(() => {
    const c = this.claims();
    return c ? { id: c.sub, email: c.email, name: c.name, role: c.role } : null;
  });

  readonly role = computed<UserRole | null>(() => this.claims()?.role ?? null);
  readonly permissions = computed(() => new Set<Permission>(this.claims()?.permissions ?? []));
  readonly isLoggedIn = computed(() => this.claims() !== null && this._refreshToken() !== null);

  // ---- Autenticación (¿quién eres?) ----------------------------------------
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/login`, { email, password }, this.skipAuth)
      .pipe(
        tap(res => this.storeTokens(res)),
        map(res => res.user),
      );
  }

  /**
   * Sesión válida = hay usuario y el refresh token no ha caducado.
   * (Un access token caducado no cierra la sesión: el interceptor lo renueva.)
   */
  hasValidSession(): boolean {
    if (!this.isLoggedIn()) return false;
    const refreshClaims = decodeJwt<{ exp: number }>(this._refreshToken());
    if (isTokenExpired(refreshClaims)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  /** Pide un access token nuevo con el refresh token. Comparte la petición en curso. */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token'));
    }
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthTokens>(`${this.api}/auth/refresh`, { refreshToken }, this.skipAuth)
        .pipe(
          tap(tokens => this.storeTokens(tokens)),
          map(tokens => tokens.accessToken),
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  /** Cierra sesión y vuelve al login, opcionalmente recordando a dónde quería ir. */
  logout(returnUrl?: string): void {
    this.clearSession();
    const queryParams = returnUrl && returnUrl !== '/login' ? { returnUrl } : {};
    this.router.navigate(['/login'], { queryParams });
  }

  // ---- Autorización (¿qué puedes hacer?) -----------------------------------
  /** true si el usuario tiene alguno de los roles indicados. */
  hasRole(...roles: UserRole[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  /** true si el rol del usuario es igual o superior en la jerarquía. */
  hasMinRole(role: UserRole): boolean {
    const current = this.role();
    return current !== null && ROLE_LEVEL[current] >= ROLE_LEVEL[role];
  }

  hasPermission(...required: Permission[]): boolean {
    const owned = this.permissions();
    return required.every(p => owned.has(p));
  }

  /** Pantalla de inicio según el rol (tras el login sin returnUrl). */
  homeFor(role: UserRole | null = this.role()): string {
    switch (role) {
      case 'admin': return '/admin';
      case 'supervisor': return '/informes';
      default: return '/home';
    }
  }

  // ---- Solo para la demo con backend simulado ------------------------------
  /** Fuerza que el access token esté caducado para probar el flujo 401 → refresh. */
  simulateExpiredAccessToken(): void {
    const token = this._accessToken();
    const claims = this.claims();
    if (!token || !claims) return;
    const [header, , signature] = token.split('.');
    const expiredPayload = base64UrlEncode(JSON.stringify({ ...claims, exp: claims.exp - 3600 * 24 }));
    this.setAccessToken(`${header}.${expiredPayload}.${signature}`);
  }

  // ---- Persistencia --------------------------------------------------------
  private storeTokens({ accessToken, refreshToken }: AuthTokens): void {
    this.setAccessToken(accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    this._refreshToken.set(refreshToken);
  }

  private setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_KEY, token);
    this._accessToken.set(token);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // Limpieza de claves de la versión anterior del servicio
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this.refreshInFlight$ = null;
  }
}
