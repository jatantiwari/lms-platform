import { create } from 'zustand';
import { User } from '../types';
import { authApi, setAccessToken, setRefreshToken, clearTokens, getAccessToken } from '../lib/api';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  setUser: (u) => set({ user: u }),

  async login(email, password) {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = data.data;
      await setAccessToken(accessToken);
      await setRefreshToken(refreshToken);
      // Persist user to SecureStore for offline hydration
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      set({ user, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  async logout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    await clearTokens();
    await SecureStore.deleteItemAsync('user');
    set({ user: null });
  },

  async fetchMe() {
    try {
      const { data } = await authApi.getMe();
      const u: User = data.data;
      await SecureStore.setItemAsync('user', JSON.stringify(u));
      set({ user: u });
      return u;
    } catch {
      set({ user: null });
      return null;
    }
  },

  async hydrate() {
    try {
      const token = await getAccessToken();
      if (!token) { set({ isHydrated: true }); return; }
      // Try fresh fetch first
      const { data } = await authApi.getMe();
      const u: User = data.data;
      await SecureStore.setItemAsync('user', JSON.stringify(u));
      set({ user: u, isHydrated: true });
    } catch {
      // Fallback to cached user
      const cached = await SecureStore.getItemAsync('user');
      if (cached) {
        try { set({ user: JSON.parse(cached), isHydrated: true }); return; } catch { /* ignore */ }
      }
      set({ user: null, isHydrated: true });
    }
  },
}));

export const useUser = () => useAuthStore((s) => s.user);
