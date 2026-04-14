/**
 * Store de Autenticación y Usuario
 * Manejo del estado de autenticación y usuario actual
 */

import { create } from 'zustand';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    set({ user: null, token: null, error: null });
    AsyncStorage.removeItem('@idatgram_token');
    AsyncStorage.removeItem('@idatgram_user');
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('@idatgram_token');
      const userJson = await AsyncStorage.getItem('@idatgram_user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ token, user });
      }
    } catch (error) {
      console.error('Error cargando auth desde storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { token, user } = get();
      if (token) await AsyncStorage.setItem('@idatgram_token', token);
      if (user) await AsyncStorage.setItem('@idatgram_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error guardando auth en storage:', error);
    }
  },
}));
