import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setCybersoftAccessToken } from '@/lib/cybersoftApi';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        setCybersoftAccessToken(accessToken);
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        setCybersoftAccessToken(null);
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
      // The axios interceptor keeps the bearer token in a module-level variable,
      // so it has to be re-seeded from persisted state on a fresh page load.
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setCybersoftAccessToken(state.accessToken);
      },
    },
  ),
);
