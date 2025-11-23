import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
}

// Mock authentication - replace with real auth later
const mockLogin = async (email: string, _password: string): Promise<User> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email,
    name: email.split('@')[0],
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  };
};

const mockSignup = async (
  email: string,
  _password: string,
  name: string
): Promise<User> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email,
    name,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const user = await mockLogin(email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const user = await mockSignup(email, password, name);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'cad-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
