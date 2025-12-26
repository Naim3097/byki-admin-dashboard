// UI Store using Zustand
import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: UINotification[];
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<UINotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  notifications: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentPage: (page: string) => set({ currentPage: page }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `notif_${Date.now()}` },
      ],
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
