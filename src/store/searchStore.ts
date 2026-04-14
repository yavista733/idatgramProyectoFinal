/**
 * Store de Búsqueda
 */

import { create } from 'zustand';
import { SearchState } from '../types';
import { searchUsers } from '../database/userRepository';

interface SearchStore extends SearchState {
  searchUsersAndPosts: (query: string) => Promise<void>;
  clearSearch: () => void;
  setQuery: (query: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  error: null,

  searchUsersAndPosts: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], query: '' });
      return;
    }

    set({ isLoading: true, error: null, query });
    try {
      const users = await searchUsers(query, 20);
      set({ results: users, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error en búsqueda',
      });
    }
  },

  clearSearch: () => set({ query: '', results: [], error: null }),
  setQuery: (query: string) => set({ query }),
}));
