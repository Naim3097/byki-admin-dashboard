// Auth Hook
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, loading, error, signIn, signOut, clearError, initializeAuth } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superAdmin',
    isStaff: ['staff', 'admin', 'superAdmin'].includes(user?.role || ''),
    signIn,
    signOut,
    clearError,
  };
}
