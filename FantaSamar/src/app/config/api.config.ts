// In sviluppo l'host viene dedotto dinamicamente dal browser (location.hostname),
// così l'app funziona sia da http(s)://localhost sia da un dispositivo remoto
// che apre http(s)://<ip-del-pc>:4200 sulla stessa rete locale.
// In produzione (build), sovrascrivi questo valore con l'URL pubblico del backend,
// ad esempio 'https://tuo-dominio.it/api' oppure il path relativo '/api'.
const DEV_API_PORT = 3000;

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${DEV_API_PORT}/api`;
  }
  return `https://localhost:${DEV_API_PORT}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
