/**
 * Store de Historias
 * Manejo del estado de historias
 */

import { create } from 'zustand';
import { StoriesState } from '../types';
import { getActiveStoriesForFeed, recordStoryView, cleanExpiredStories } from '../database/storyRepository';
import { useAuthStore } from './authStore';

interface StoriesStore extends StoriesState {
  loadStories: () => Promise<void>;
  recordView: (storyId: string) => Promise<void>;
  dismissStory: (userId: string) => void;
  cleanExpired: () => Promise<void>;
}

export const useStoriesStore = create<StoriesStore>((set, get) => ({
  stories: [],
  isLoading: false,
  error: null,

  loadStories: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Usuario no autenticado' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const stories = await getActiveStoriesForFeed(user.id);
      set({ stories, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Error cargando historias' 
      });
    }
  },

  recordView: async (storyId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await recordStoryView(storyId, user.id);
    } catch (error) {
      console.error('Error recording story view:', error);
    }
  },

  dismissStory: (userId: string) => {
    const newStories = get().stories.filter(s => s.user.id !== userId);
    set({ stories: newStories });
  },

  cleanExpired: async () => {
    try {
      await cleanExpiredStories();
      get().loadStories();
    } catch (error) {
      console.error('Error cleaning expired stories:', error);
    }
  },
}));
