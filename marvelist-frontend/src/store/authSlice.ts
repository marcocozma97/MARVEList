import { createSlice,type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../services/userService';
import { isTokenExpired, readToken } from '../utils/session';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  profile: UserProfile | null; // nickname e avatar, condivisi tra Navbar e Area Personale
  sessionExpired: boolean;     // token scaduto: si rinnova con il minigioco senza rifare il login
}

// All'apertura dell'app un token salvato basta per risultare loggati; se è scaduto parte il minigioco
const savedToken = readToken();
const initialState: AuthState = {
  isAuthenticated: !!savedToken,
  token: savedToken,
  profile: null,
  sessionExpired: !!savedToken && isTokenExpired(savedToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = true;
      state.token = action.payload;
      state.profile = null;
      state.sessionExpired = false;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.profile = null;
      state.sessionExpired = false;
    },
    sessionExpired: (state) => {
      if (state.isAuthenticated) state.sessionExpired = true;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    }
  }
});

export const { loginSuccess, logoutSuccess, sessionExpired, setProfile } = authSlice.actions;
export default authSlice.reducer;
