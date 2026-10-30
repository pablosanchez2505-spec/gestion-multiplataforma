import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('auth_access_token', 'h.e30.s');
    localStorage.setItem('auth_refresh_token', 'h.e30.s');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('añade Bearer a las llamadas a nuestra API', () => {
    http.get('/api/items').subscribe();
    const req = backend.expectOne('/api/items');
    expect(req.request.headers.get('Authorization')).toBe('Bearer h.e30.s');
    req.flush([]);
  });

  it('NO envía el token a dominios de terceros', () => {
    http.get('https://otro-dominio.com/datos').subscribe();
    const req = backend.expectOne('https://otro-dominio.com/datos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
