/**
 * App.tsx – Entry point con Offline-First, Auto-Sync y Monitoreo de Conectividad
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { initDatabase } from './src/database/sqlite';
import { getUserByEmail, createUser } from './src/database/userRepository';
import { useAuthStore } from './src/store/authStore';
import { useConnectivityStore } from './src/store/connectivityStore';
import { backgroundSync } from './src/services/syncService';
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const DemoUser = {
  id: 'demo-user-1',
  username: 'demo',
  email: 'test@example.com',
  displayName: 'Usuario Demo',
  bio: 'Cuenta de prueba',
  profileImageUrl: '',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isVerified: false,
  isPrivate: false,
  website: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Error de Inicialización</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.logoText}>idatgram</Text>
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

async function seedDemoUser() {
  try {
    const existing = await getUserByEmail('test@example.com');
    if (!existing) {
      await createUser(DemoUser);
      console.log('✅ Usuario demo creado');
    }
  } catch (e) {
    console.warn('Error creando usuario demo:', e);
  }
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const startMonitoring = useConnectivityStore((s) => s.startMonitoring);

  const initialize = async () => {
    setInitError(null);
    try {
      // 1. Inicializar SQLite (carga datos locales primero – Offline-First)
      await initDatabase();

      // 2. Crear usuario demo si no existe
      await seedDemoUser();

      // 3. Cargar auth desde storage
      await useAuthStore.getState().loadFromStorage();

      // 4. Iniciar monitoreo de conectividad + auto-sync cada 30s
      const cleanup = startMonitoring();

      // 5. Background sync (si hay conexión, sincroniza con Supabase)
      backgroundSync().catch(() => { });

      setIsInitialized(true);
    } catch (error: any) {
      console.error('❌ Init error:', error?.message || error);
      setInitError(error?.message || 'Error desconocido al inicializar la app');
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  if (initError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorScreen message={initError} onRetry={initialize} />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#000',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: '#8e8e8e',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ED4956',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3797EF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
