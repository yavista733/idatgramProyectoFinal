/**
 * Pantalla de Registro - Estilo Instagram
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/UI';
import { createUser } from '../../database/userRepository';
import { uploadUser } from '../../services/supabaseService';
import { User } from '../../types';

const RegisterScreen = ({ navigation }: any) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken } = useAuthStore();

  const handleRegister = async () => {
    if (!displayName || !username || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const newUser: User = {
        id: String(Date.now()),
        username,
        email,
        displayName,
        bio: '',
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
      
      await createUser(newUser);
      
      const uploaded = await uploadUser(newUser);
      if (!uploaded) {
        console.warn('⚠️ No se pudo subir usuario a Supabase, continuando...');
      }
      
      setUser(newUser);
      setToken('demo-token-' + newUser.id);
      await useAuthStore.getState().saveToStorage();
    } catch (err) {
      setError('Error al crear cuenta. El email o usuario ya existe.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Botón atrás */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#262626" />
        </TouchableOpacity>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>idatgram</Text>
            <Text style={styles.logoSubtitle}>Crea tu cuenta gratuita</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#8e8e8e"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              placeholderTextColor="#8e8e8e"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#8e8e8e"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#8e8e8e"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#8e8e8e"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Link a login */}
          <TouchableOpacity
            style={styles.loginLinkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{'  '}
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Al registrarte aceptas nuestras Condiciones y Política de privacidad.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 4,
  },
  formContainer: {
    gap: 10,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#262626',
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  errorText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dbdbdb',
  },
  dividerText: {
    color: '#8e8e8e',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  loginLinkButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
  },
  loginLinkText: {
    color: '#262626',
    fontSize: 14,
  },
  loginLink: {
    color: '#3797EF',
    fontWeight: '600',
  },
  footer: {
    color: '#8e8e8e',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 16,
  },
});

export default RegisterScreen;
