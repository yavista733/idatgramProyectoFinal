/**
 * Pantalla de Inicio de Sesión - Estilo Instagram
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
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/UI';
import { getUserByEmail } from '../../database/userRepository';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const user = await getUserByEmail(email);
      if (user && password === 'password123') {
        setUser(user);
        setToken('demo-token-' + user.id);
        await useAuthStore.getState().saveToStorage();
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (err) {
      setError('Email no registrado');
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
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Logo ── */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>idatgram</Text>
          </View>

          {/* ── Formulario ── */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico o usuario"
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

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divisor ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Registrarse ── */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{'  '}
              <Text style={styles.registerLink}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            Al iniciar sesión aceptas nuestras Condiciones y Política de privacidad.
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 50,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontWeight: '700',
    color: '#000',
    letterSpacing: -1,
  },
  formContainer: {
    gap: 12,
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
    marginBottom: 8,
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
  loginButton: {
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#3797EF',
    fontSize: 13,
    fontWeight: '500',
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
  registerButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
  },
  registerText: {
    color: '#262626',
    fontSize: 14,
  },
  registerLink: {
    color: '#3797EF',
    fontWeight: '600',
  },
  footer: {
    color: '#8e8e8e',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});

export default LoginScreen;

