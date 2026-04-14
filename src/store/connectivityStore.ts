/**
 * ConnectivityStore – Estado global de conectividad
 * Sensor de Conectividad Real: verifica acceso a internet cada 30 segundos
 * haciendo un fetch HEAD a google.com (src/utils/connectivity.ts)
 *
 * Al recuperar internet → llama a fullSync() automáticamente
 * Requisito del profesor: isOnline en el estado global + sync automático al reconectar
 */

import { create } from 'zustand';
import { checkRealConnectivity } from '../utils/connectivity';
import { fullSync, startAutoSync, stopAutoSync } from '../services/syncService';

const POLLING_INTERVAL_MS = 30000; // 30 segundos

interface ConnectivityStore {
  isOnline: boolean;
  lastSyncAt: number | null;
  isSyncing: boolean;

  /** Inicia el monitoreo de conectividad con polling cada 30s */
  startMonitoring: () => () => void;
  /** Fuerza una sincronización manual */
  forceSync: () => Promise<void>;
}

export const useConnectivityStore = create<ConnectivityStore>((set, get) => ({
  isOnline: true,
  lastSyncAt: null,
  isSyncing: false,

  startMonitoring: () => {
    // Iniciar auto-sync cada 30 segundos
    startAutoSync(POLLING_INTERVAL_MS);

    // Verificar conectividad real con fetch HEAD a google.com cada 30 segundos
    const pollId = setInterval(async () => {
      const wasOnline = get().isOnline;
      const nowOnline = await checkRealConnectivity();

      set({ isOnline: nowOnline });

      // Si pasamos de offline → online, sincronizar inmediatamente
      if (!wasOnline && nowOnline) {
        console.log('🌐 Reconexión detectada (fetch HEAD google.com) – sincronizando...');
        get().forceSync();
      }
    }, POLLING_INTERVAL_MS);

    // Check inicial inmediato
    (async () => {
      const online = await checkRealConnectivity();
      set({ isOnline: online });
      if (online) {
        console.log('🌐 Conectividad verificada (fetch HEAD google.com) – online');
      } else {
        console.log('📴 Sin conexión a internet detectada');
      }
    })();

    // Retorna función de limpieza
    return () => {
      clearInterval(pollId);
      stopAutoSync();
    };
  },

  forceSync: async () => {
    if (get().isSyncing) return;

    set({ isSyncing: true });
    try {
      await fullSync();
      set({ lastSyncAt: Date.now(), isSyncing: false });
    } catch (error) {
      console.warn('⚠️ Error en forceSync:', error);
      set({ isSyncing: false });
    }
  },
}));
