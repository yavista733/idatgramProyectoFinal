/**
 * Pantalla de Posts Guardados
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/UI';

const SavedPostsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guardado</Text>
        <View style={{ width: 36 }} />
      </View>

      <EmptyState
        icon="bookmark-outline"
        title="Sin publicaciones guardadas"
        message="Las publicaciones que guardes aparecerán aquí"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
});

export default SavedPostsScreen;
