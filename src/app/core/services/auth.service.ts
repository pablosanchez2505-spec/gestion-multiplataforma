import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { LoginResponse, User, UserRole } from '../models/user.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Usuarios sintéticos de prueba (datos ficticios)
const MOCK_USERS: (User & { password: string })[] = [
  { id: 1, email: 'admin@demo.com', name: 'Admin Demo', role: 'admin', password: 'Admin123!' },
  { id: 2, email: 'usuario@demo.com', name: 'Usuario Demo', role: 'user', password: 'Usuario123!' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Estado global: el usuario actual (null si no hay sesión)
  private readonly _user = signal<User | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!found) {
      return throwError(() => new Error('Credenciales incorrectas')).pipe(delay(500));
    }

    const { password: _omit, ...user } = found;
    const response: LoginResponse = { user, token: this.fakeJwt(user) };

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);

    return of(response).pipe(delay(500));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  hasRole(role: UserRole): boolean {
    return this._user()?.role === role;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // JWT simulado: cabecera.payload.firma (solo para pruebas)
  private fakeJwt(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 3600_000 }));
    return `${header}.${payload}.firma-simulada`;
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}