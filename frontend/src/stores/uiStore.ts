import { create } from 'zustand';
import type { Toast, ModalState } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  toasts: Toast[];
  modal: ModalState | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'light',
  toasts: [],
  modal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => set({ theme }),
  
  showToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },
  
  removeToast: (id) => {
    set((state) => ({ 
      toasts: state.toasts.filter((t) => t.id !== id) 
    }));
  },
  
  showModal: (modal) => set({ modal: { ...modal, isOpen: true } }),
  
  closeModal: () => set({ modal: null }),
}));
