/**
 * Componentes de UI Reutilizables - Instagram style
 */

import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Avatar de usuario
 */
export const Avatar = ({ source, size = 'md', onPress }: any) => {
  const sizeValue: Record<string,number> = { sm: 32, md: 44, lg: 56, xl: 86 };
  const px = sizeValue[size] ?? 44;

  const imgStyle = { width: px, height: px, borderRadius: px / 2, backgroundColor: '#dbdbdb' as const };

  const content = source ? (
    <Image source={typeof source === 'string' ? { uri: source } : source} style={imgStyle} />
  ) : (
    <View style={[imgStyle, styles.avatarPlaceholder]}>
      <Ionicons name="person" size={Math.round(px * 0.55)} color="#999" />
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
};

/**
 * Loading spinner
 */
export const LoadingSpinner = ({ color = '#3797EF' }: any) => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={color} />
  </View>
);

/**
 * Empty state
 */
export const EmptyState = ({ icon = 'images-outline', title = 'Sin resultados', message = '' }: any) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon as any} size={60} color="#dbdbdb" />
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 16 },
  emptyMessage: { fontSize: 13, color: '#8e8e8e', textAlign: 'center', marginTop: 8 },
});
