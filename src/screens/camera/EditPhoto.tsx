/**
 * Pantalla de Edición de Foto / Nuevo Post
 * Usa postsStore.addPost con isSubmitting para deshabilitar botón
 * Indicador visual de sincronización pendiente
 */

import React from 'react';
import {
  View,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePostsStore } from '../../store/postsStore';
import { useAuthStore } from '../../store/authStore';
import { saveImagePermanently } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const EditPhotoScreen = ({ route, navigation }: any) => {
  const { imageUri } = route.params;
  const [description, setDescription] = React.useState('');
  const user = useAuthStore((s) => s.user);
  const addPost = usePostsStore((s) => s.addPost);
  const isSubmitting = usePostsStore((s) => s.isSubmitting);

  const handleShare = async () => {
    if (!user || isSubmitting) return;
    const permanentUri = await saveImagePermanently(imageUri);
    await addPost(description, permanentUri);
    navigation.getParent()?.getParent()?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isSubmitting}>
          <Ionicons name="chevron-back" size={28} color={isSubmitting ? '#ccc' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo post</Text>
        <TouchableOpacity onPress={handleShare} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#3797EF" />
          ) : (
            <Text style={[styles.shareBtn, isSubmitting && styles.shareBtnDisabled]}>
              Compartir
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.captionRow}>
          <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          <TextInput
            style={styles.captionInput}
            placeholder="Escribe una descripción..."
            placeholderTextColor="#8e8e8e"
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.syncInfo}>
          <Ionicons name="cloud-upload-outline" size={16} color="#FF9800" />
          <Text style={styles.syncText}>
            Se guardará como &quot;Pendiente&quot; hasta sincronizar
          </Text>
        </View>
        <View style={styles.divider} />
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  shareBtn: { fontSize: 15, fontWeight: '700', color: '#3797EF' },
  shareBtnDisabled: { color: '#ccc' },
  captionRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 4, backgroundColor: '#efefef' },
  captionInput: { flex: 1, fontSize: 15, color: '#000', minHeight: 60, textAlignVertical: 'top' },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff3e0',
    gap: 6,
  },
  syncText: { fontSize: 12, color: '#FF9800', fontWeight: '500' },
  divider: { height: 0.5, backgroundColor: '#dbdbdb' },
  preview: { width, height: width, marginTop: 10, backgroundColor: '#efefef' },
});

export default EditPhotoScreen;
