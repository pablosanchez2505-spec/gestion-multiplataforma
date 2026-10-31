import { sha256Fallback, sha256Hex } from './hash.util';

describe('hash.util', () => {
  // Valores de referencia del estándar SHA-256
  const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

  it('la implementación de respaldo coincide con el estándar', () => {
    expect(sha256Fallback('')).toBe(EMPTY);
    expect(sha256Fallback('abc')).toBe(ABC);
  });

  it('el respaldo funciona con textos largos (varios bloques) y acentos', async () => {
    const long = 'contraseña-ñ'.repeat(40);
    expect(sha256Fallback(long)).toBe((await digest(long)).join(''));
  });

  it('sha256Hex devuelve 64 caracteres hexadecimales', async () => {
    expect(await sha256Hex('abc')).toBe(ABC);
  });

  async function digest(text: string): Promise<string[]> {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0'));
  }
});
