import { JwtClaims } from '../models/user.model';

/** Decodifica base64url (formato usado por JWT) a texto UTF-8. */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Codifica texto UTF-8 a base64url. */
export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Lee los claims de un JWT SIN verificar la firma.
 * En el cliente solo se usan para la UI; la verificación real es del backend.
 */
export function decodeJwt<T = JwtClaims>(token: string | null): T | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as T;
  } catch {
    return null;
  }
}

/** true si el token ha caducado (con un margen de seguridad en segundos). */
export function isTokenExpired(claims: { exp: number } | null, skewSeconds = 0): boolean {
  if (!claims) return true;
  return claims.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}
