/**
 * Utilidades y funciones helper
 */

import { Dimensions, Platform } from 'react-native';
import { Paths, File } from 'expo-file-system';

/**
 * Obtiene las dimensiones de la pantalla
 */
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Verifica si es iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Verifica si es Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Formatea una fecha a formato legible
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString();
}

/**
 * Formatea números grandes (1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida una contraseña
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Valida un username
 */
export function isValidUsername(username: string): boolean {
  // Solo números, letras y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copia una imagen al directorio de documentos para persistencia
 */
export async function saveImagePermanently(tempUri: string): Promise<string> {
  try {
    const imagesDir = new File(Paths.document, 'images');
    if (!imagesDir.exists) {
      imagesDir.create();
    }

    const filename = `post_${generateId()}.jpg`;
    const destFile = new File(imagesDir, filename);

    const cleanUri = tempUri.startsWith('file://') ? tempUri : `file://${tempUri}`;
    const response = await fetch(cleanUri);
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    await destFile.write(uint8Array);

    console.log('✅ Imagen guardada:', destFile.uri);
    return destFile.uri;
  } catch (error) {
    console.warn('⚠️ Error guardando imagen:', error);
    return tempUri;
  }
}

/**
 * Obtiene la diferencia de tiempo en formato legible
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  if (weeks < 4) return `hace ${weeks}w`;

  return formatDate(timestamp);
}

/**
 * Trunca un texto a X caracteres
 */
export function truncateText(text: string, limit: number = 100): string {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
