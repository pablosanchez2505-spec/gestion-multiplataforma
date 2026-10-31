import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PartialMatchRouteSnapshot, Route, Router, UrlTree, provideRouter } from '@angular/router';

import { UserRole } from '../models/user.model';
import { base64UrlEncode } from '../utils/jwt.util';
import { roleGuard } from './role.guard';

function loginAs(role: UserRole): void {
  const payload = base64UrlEncode(JSON.stringify({ sub: 1, role, permissions: [], exp: 9999999999 }));
  localStorage.setItem('auth_access_token', `h.${payload}.s`);
  localStorage.setItem('auth_refresh_token', `h.${payload}.s`);
}

function run(...allowed: UserRole[]): boolean | UrlTree {
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  return TestBed.runInInjectionContext(() => roleGuard(...allowed)({} as Route, [], {} as PartialMatchRouteSnapshot)) as boolean | UrlTree;
}

describe('roleGuard', () => {
  afterEach(() => localStorage.clear());

  it('deja pasar si el rol está permitido', () => {
    loginAs('supervisor');
    expect(run('supervisor', 'admin')).toBe(true);
  });

  it('redirige a /forbidden si el rol no está permitido', () => {
    loginAs('user');
    const result = run('admin');
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/forbidden');
  });
});
