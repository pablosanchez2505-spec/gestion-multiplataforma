import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { JwtClaims, Permission, UserRole } from './core/models/user.model';
import { base64UrlEncode } from './core/utils/jwt.util';

/** Crea una sesión falsa en localStorage con el rol indicado. */
function fakeSession(role: UserRole, permissions: Permission[] = []): void {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const claims: JwtClaims = { sub: 1, email: 'x@demo.com', name: 'Test', role, permissions, iat: 0, exp };
  const jwt = (payload: object) => `h.${base64UrlEncode(JSON.stringify(payload))}.s`;
  localStorage.setItem('auth_access_token', jwt(claims));
  localStorage.setItem('auth_refresh_token', jwt({ sub: 1, type: 'refresh', exp }));
}

async function menuLinks(): Promise<string[]> {
  await TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [provideRouter([]), provideHttpClient()],
  }).compileComponents();
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  // Se leen los routerLink del menú (el texto de ion-label se hidrata de forma asíncrona en jsdom)
  const items = fixture.nativeElement.querySelectorAll('ion-menu ion-item[routerLink]') as NodeListOf<HTMLElement>;
  return Array.from(items).map(i => i.getAttribute('routerLink') ?? '');
}

describe('AppComponent (menú por rol)', () => {
  afterEach(() => localStorage.clear());

  it('sin sesión no muestra menú', async () => {
    expect(await menuLinks()).toEqual([]);
  });

  it('usuario: no ve Informes ni Administración', async () => {
    fakeSession('user');
    const links = await menuLinks();
    expect(links).toContain('/home');
    expect(links).not.toContain('/informes');
    expect(links).not.toContain('/admin');
  });

  it('supervisor: ve Informes pero no Administración', async () => {
    fakeSession('supervisor');
    const links = await menuLinks();
    expect(links).toContain('/informes');
    expect(links).not.toContain('/admin');
  });

  it('admin: lo ve todo', async () => {
    fakeSession('admin');
    const links = await menuLinks();
    expect(links).toContain('/informes');
    expect(links).toContain('/admin');
  });
});
