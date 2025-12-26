// Auth Store using Zustand
import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/auth.service';
import { AdminUser } from '../types/user';

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authService.signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const adminUser = await authService.getCurrentAdmin();
          set({ user: adminUser, loading: false });
        } catch {
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },
}));
