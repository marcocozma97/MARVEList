import axios from 'axios';

// Di default usa lo stesso host della pagina: da PC è localhost, dallo smartphone è l'IP del PC
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8080/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aggiunge il token JWT salvato a ogni richiesta
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('marvelist_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});