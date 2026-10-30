import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SKIP_FORBIDDEN_REDIRECT } from '../interceptors/http-context.tokens';
import { Permission, User } from '../models/user.model';

export interface Item { id: number; name: string; category: string; stock: number; createdBy: string; }
export interface NewItem { name: string; category: string; stock: number; }
export interface Report { totalItems: number; totalStock: number; outOfStock: string[]; byCategory: Record<string, number>; }
export interface AdminUser extends User { permissions: Permission[]; }
export interface Profile { name: string; email: string; phone: string; department: string; }

/**
 * Servicio de datos. Fíjate en que NO añade cabeceras ni trata 401/403:
 * de eso se encargan los interceptores (separación de responsabilidades).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.api}/items`);
  }

  createItem(item: NewItem): Observable<Item> {
    return this.http.post<Item>(`${this.api}/items`, item);
  }

  deleteItem(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.api}/items/${id}`);
  }

  getReport(): Observable<Report> {
    return this.http.get<Report>(`${this.api}/reports`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/admin/users`);
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.api}/profile`);
  }

  updateProfile(data: Pick<Profile, 'phone' | 'department'>): Observable<Profile> {
    return this.http.put<Profile>(`${this.api}/profile`, data);
  }

  /** Demo: llama a un endpoint de admin. Si no eres admin el backend responde 403. */
  probeAdminEndpoint(handle403Locally = false): Observable<AdminUser[]> {
    const context = new HttpContext().set(SKIP_FORBIDDEN_REDIRECT, handle403Locally);
    return this.http.get<AdminUser[]>(`${this.api}/admin/users`, { context });
  }
}
