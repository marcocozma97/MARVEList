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

  // Non restituisce il token: l'account va prima confermato dal link nella mail
  register: async (userData: RegisterRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Il backend risponde { message: "..." }
  verifyEmail: async (token: string): Promise<string> => {
    const response = await api.get('/auth/verify', { params: { token } });
    return response.data.message;
  },

  logout: () => {
    localStorage.removeItem('marvelist_token');
    clearIntroPending();
  }
};