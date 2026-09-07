// In sviluppo (ng serve, porta 4200) l'host dell'API viene dedotto dinamicamente
// dal browser (location.hostname) sulla porta 3000, così l'app funziona sia da
// http(s)://localhost sia da un dispositivo remoto che apre http(s)://<ip-del-pc>:4200
// sulla stessa rete locale.
// In produzione (build servita da nginx sulla stessa origine del backend, con
// reverse proxy su /api/) si usa invece il path relativo '/api', che funziona
// automaticamente con qualsiasi dominio/IP pubblico senza bisogno di rebuild.
const DEV_SERVER_PORT = '4200';
const DEV_API_PORT = 3000;

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (port === DEV_SERVER_PORT) {
      return `${protocol}//${hostname}:${DEV_API_PORT}/api`;
    }
    return '/api';
  }
  return `https://localhost:${DEV_API_PORT}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
