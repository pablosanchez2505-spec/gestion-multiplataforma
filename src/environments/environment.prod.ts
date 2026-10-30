export const environment = {
  production: true,
  apiUrl: '/api',
  // Se mantiene el backend simulado también en el despliegue (Vercel) porque
  // el proyecto todavía no tiene API real. Al conectar una API, poner a false.
  useMockBackend: true,
  accessTokenTtlSeconds: 120,
  refreshTokenTtlSeconds: 60 * 60 * 24,
};
