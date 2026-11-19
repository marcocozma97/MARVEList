import { api } from './api';
import { clearIntroPending } from '../utils/intro';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginRequest) => {
    const response = await api.post('/auth/authenticate', credentials);
    return response.data;
  },
  
  // Scambia il token scaduto con uno nuovo da 24 ore
  refresh: async (expiredToken: string): Promise<{ token: string }> => {
    const response = await api.post('/auth/refresh', null, { headers: { Authorization: `Bearer ${expiredToken}` } });
    return response.data;
  },

  // Non restituisce il token: l'account va prima confermato dal link nella mail,
  // tranne quando le mail del giorno sono finite (active: true)
  register: async (userData: RegisterRequest): Promise<{ message: string; active?: boolean }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Il backend risponde { message: "..." }
  verifyEmail: async (token: string): Promise<string> => {
    const response = await api.get('/auth/verify', { params: { token } });
    return response.data.message;
  },

  // "Password dimenticata?": la risposta è la stessa che l'email sia registrata o no
  forgotPassword: async (email: string): Promise<string> =>
    (await api.post('/auth/forgot-password', { email })).data.message,

  // Nuova password dalla pagina aperta dal link nella mail
  resetPassword: async (token: string, password: string): Promise<string> =>
    (await api.post('/auth/reset-password', { token, password })).data.message,

  logout: () => {
    localStorage.removeItem('marvelist_token');
    clearIntroPending();
  }
};