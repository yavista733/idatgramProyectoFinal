import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import { checkRealConnectivity } from '../utils/connectivity';
import { fullSync, startAutoSync, stopAutoSync } from '../services/syncService';

const POLLING_INTERVAL_MS = 30000;

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
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('🚀 App regresó al primer plano - Verificando conexión...');
        const nowOnline = await checkRealConnectivity();
        set({ isOnline: nowOnline });
        
        if (nowOnline) {
          console.log('🔄 Conexión detectada al volver - Sincronizando datos...');
          get().forceSync();
        }
      }
    });

    const pollId = setInterval(async () => {
      const wasOnline = get().isOnline;
      const nowOnline = await checkRealConnectivity();
      set({ isOnline: nowOnline });

      if (!wasOnline && nowOnline) {
        console.log('🌐 Reconexión detectada por polling – Sincronizando...');
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
      appStateSubscription.remove();
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
