import { createSlice,type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../services/userService';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  profile: UserProfile | null; // nickname e avatar, condivisi tra Navbar e Area Personale
}

// All'apertura dell'app un token salvato basta per risultare loggati
const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('marvelist_token'),
  token: localStorage.getItem('marvelist_token'),
  profile: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = true;
      state.token = action.payload;
      state.profile = null;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.profile = null;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    }
  }
});

export const { loginSuccess, logoutSuccess, setProfile } = authSlice.actions;
export default authSlice.reducer;
