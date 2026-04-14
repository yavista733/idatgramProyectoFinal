/**
 * Pantalla de Crear Post
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const AddPostScreen = ({ navigation }: any) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handleTakePhoto = async () => {
    if (cameraPermission?.status !== 'granted') {
      await requestCameraPermission();
    }
    navigation.navigate('TakePhoto');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      navigation.navigate('EditPhoto', { imageUri: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Nueva publicación</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="images-outline" size={72} color="#dbdbdb" />
        </View>

        <Text style={styles.title}>Compartir fotos</Text>
        <Text style={styles.subtitle}>Toma una foto o selecciona una de tu galería</Text>

        <TouchableOpacity style={styles.btnPrimary} onPress={handlePickImage}>
          <Text style={styles.btnPrimaryText}>Seleccionar de la galería</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleTakePhoto}>
          <Ionicons name="camera-outline" size={20} color="#3797EF" />
          <Text style={styles.btnSecondaryText}>Tomar una foto</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  navTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8e8e8e', textAlign: 'center', marginBottom: 32 },
  btnPrimary: {
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: { color: '#3797EF', fontSize: 15, fontWeight: '600' },
});

export default AddPostScreen;
