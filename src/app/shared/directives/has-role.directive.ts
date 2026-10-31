import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { Permission, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural de UI condicional por ROL.
 *
 *   <ion-item *appHasRole="'admin'">…</ion-item>
 *   <ion-button *appHasRole="['admin', 'supervisor']">…</ion-button>
 *
 * El elemento ni se crea en el DOM si el rol no coincide (no basta con ocultarlo
 * con CSS). Es reactiva: al cambiar la sesión (login/logout/refresh) se reevalúa
 * sola gracias al effect() sobre las signals de AuthService.
 *
 * ⚠ Esto es UX, no seguridad: la protección real está en guards + backend.
 */
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  readonly appHasRole = input.required<UserRole | UserRole[]>();

  private readonly auth = inject(AuthService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private rendered = false;

  constructor() {
    effect(() => {
      const value = this.appHasRole();
      const roles = Array.isArray(value) ? value : [value];
      this.render(this.auth.hasRole(...roles));
    });
  }

  private render(show: boolean): void {
    if (show && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl);
      this.rendered = true;
    } else if (!show && this.rendered) {
      this.vcr.clear();
      this.rendered = false;
    }
  }
}

/**
 * Igual que la anterior pero por PERMISO (más fina que el rol).
 *
 *   <ion-button *appHasPermission="'items:write'">Nuevo</ion-button>
 */
@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective {
  readonly appHasPermission = input.required<Permission | Permission[]>();

  private readonly auth = inject(AuthService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private rendered = false;

  constructor() {
    effect(() => {
      const value = this.appHasPermission();
      const perms = Array.isArray(value) ? value : [value];
      const show = this.auth.hasPermission(...perms);
      if (show && !this.rendered) {
        this.vcr.createEmbeddedView(this.tpl);
        this.rendered = true;
      } else if (!show && this.rendered) {
        this.vcr.clear();
        this.rendered = false;
      }
    });
  }
}
