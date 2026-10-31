/**
 * Modelo RBAC (Role-Based Access Control)
 * ---------------------------------------
 * Identidad (User) → Rol (UserRole) → Permisos (Permission).
 * La interfaz nunca decide los permisos: los recibe firmados dentro del JWT
 * (claim `permissions`). El frontend solo los lee para adaptar la UI.
 */

/** Roles de la aplicación, de menor a mayor privilegio. */
export type UserRole = 'user' | 'supervisor' | 'admin';

/** Permisos atómicos (recurso:acción). */
export type Permission =
  | 'items:read'
  | 'items:write'
  | 'reports:read'
  | 'users:manage';

/** Jerarquía: un rol hereda todo lo que tienen los roles de nivel inferior. */
export const ROLE_LEVEL: Record<UserRole, number> = {
  user: 1,
  supervisor: 2,
  admin: 3,
};

export const ROLE_LABEL: Record<UserRole, string> = {
  user: 'Usuario',
  supervisor: 'Supervisor',
  admin: 'Administrador',
};

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

/** Claims que viajan en el payload del access token (JWT). */
export interface JwtClaims {
  sub: number;          // id del usuario (subject)
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;          // emitido (segundos epoch)
  exp: number;          // expiración (segundos epoch)
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}
