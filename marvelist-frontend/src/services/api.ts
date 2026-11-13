import axios from 'axios';
import { store } from '../store/store';
import { logoutSuccess, sessionExpired } from '../store/authSlice';
import { TOKEN_KEY, isTokenExpired, markSessionExpired } from '../utils/session';

// Di default usa lo stesso host della pagina: da PC è localhost, dallo smartphone è l'IP del PC
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8080/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const REFRESH_URL = '/auth/refresh';

// Aggiunge il token JWT salvato a ogni richiesta. Se è scaduto non lo manda
// e si apre il minigioco che permette di rinnovarlo
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (config.url === REFRESH_URL || !token) return config;
  if (isTokenExpired(token)) {
    store.dispatch(sessionExpired());
  } else if (config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Un token valido ma non più riconosciuto dal server (il profilo personale viene rifiutato): si torna all'accesso
api.interceptors.response.use(undefined, (error) => {
  const status = error?.response?.status;
  const sentToken = error?.config?.headers?.Authorization;
  if (sentToken && error.config.url === '/users/me' && (status === 401 || status === 403)) {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* memoria non disponibile */ }
    markSessionExpired();
    store.dispatch(logoutSuccess());
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  return Promise.reject(error);
});
