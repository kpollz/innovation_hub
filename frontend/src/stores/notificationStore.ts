import { create } from 'zustand';
import { notificationsApi } from '@/api/notifications';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  isDropdownOpen: boolean;

  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  isDropdownOpen: false,

  fetchNotifications: async (page = 1, limit = 5) => {
    set({ isLoading: true });
    try {
      const response = await notificationsApi.list(page, limit);
      if (page === 1) {
        set({
          notifications: response.items,
          total: response.total,
          unreadCount: response.unread_count,
          isLoading: false,
        });
      } else {
        set((state) => ({
          notifications: [...state.notifications, ...response.items],
          total: response.total,
          unreadCount: response.unread_count,
          isLoading: false,
        }));
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silently fail
    }
  },

  markRead: async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silently fail
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silently fail
    }
  },

  toggleDropdown: () => {
    const isOpen = !get().isDropdownOpen;
    set({ isDropdownOpen: isOpen });
    if (isOpen) {
      get().fetchNotifications();
    }
  },

  closeDropdown: () => set({ isDropdownOpen: false }),
}));
