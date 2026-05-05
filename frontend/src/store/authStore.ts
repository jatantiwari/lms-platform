import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens(access, refresh) {
        set({ accessToken: access, refreshToken: refresh });
        // Also keep in localStorage for the Axios interceptor
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
      },

      setUser(user) {
        set({ user });
      },

      async login(email, password) {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password });
          const { user, accessToken, refreshToken } = data.data;
          get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      async logout() {
        try {
          await authApi.logout();
        } catch {
          // Logout silently even if server call fails
        }
        get().clear();
      },

      async fetchMe() {
        try {
          const { data } = await authApi.getMe();
          set({ user: data.data });
          return data.data as User;
        } catch {
          get().clear();
          return null;
        }
      },

      clear() {
        set({ user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },
    }),
    {
      name: 'lms-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

/** Typed selectors */
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user);
export const useUserRole = () => useAuthStore((s) => s.user?.role);
