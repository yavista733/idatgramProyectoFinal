/**
 * Store de Actividades y Notificaciones
 * Manejo del estado de notificaciones
 */

import { create } from 'zustand';
import { Notification, ActivityState } from '../types';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from '../database/notificationRepository';
import { useAuthStore } from './authStore';

interface ActivityStore extends ActivityState {
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,

  loadNotifications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Usuario no autenticado' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const notifications = await getUserNotifications(user.id, 50);
      const unreadCount = await getUnreadNotificationCount(user.id);
      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Error cargando notificaciones' 
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      const newNotifications = get().notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      set({ 
        notifications: newNotifications,
        unreadCount: Math.max(0, get().unreadCount - 1)
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);
      const newNotifications = get().notifications.map(n => ({ ...n, isRead: true }));
      set({ 
        notifications: newNotifications,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const n = get().notifications.find(notif => notif.id === notificationId);
      if (n && !n.isRead) {
        set({ unreadCount: Math.max(0, get().unreadCount - 1) });
      }
      const newNotifications = get().notifications.filter(n => n.id !== notificationId);
      set({ notifications: newNotifications });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  addNotification: (notification: Notification) => {
    const newNotifications = [notification, ...get().notifications];
    set({ 
      notifications: newNotifications,
      unreadCount: get().unreadCount + (notification.isRead ? 0 : 1)
    });
  },
}));
