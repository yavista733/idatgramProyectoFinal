
import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { updateUser } from '../../database/userRepository';
import { Avatar, LoadingSpinner } from '../../components/UI';
import { saveImagePermanently } from '../../utils/helpers';

const EditProfileScreen = ({ navigation }: any) => {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [profileImage, setProfileImage] = useState(user?.profileImageUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      console.log('📸 Foto seleccionada, guardando en directorio local...');
      const permanentUri = await saveImagePermanently(result.assets[0].uri);
      setProfileImage(permanentUri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateUser(user.id, { displayName, bio, website, profileImageUrl: profileImage });
      setUser({ ...user, displayName, bio, website, profileImageUrl: profileImage });
      navigation.goBack();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <TouchableOpacity onPress={handleSave} style={{ width: 36, alignItems: 'flex-end' }}>
          <Text style={styles.saveBtn}>{isLoading ? '...' : 'Listo'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar source={profileImage} size="xl" />
          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.fieldInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nombre completo"
            placeholderTextColor="#8e8e8e"
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Biografía</Text>
          <TextInput
            style={styles.fieldInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntanos sobre ti"
            placeholderTextColor="#8e8e8e"
            multiline
            numberOfLines={3}
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sitio web</Text>
          <TextInput
            style={styles.fieldInput}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            placeholderTextColor="#8e8e8e"
            keyboardType="url"
          />
        </View>
        <View style={styles.divider} />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  saveBtn: { fontSize: 15, fontWeight: '700', color: '#3797EF' },
  body: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  changePhotoBtn: { marginTop: 12 },
  changePhotoText: { fontSize: 14, fontWeight: '600', color: '#3797EF' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#000', width: 80 },
  fieldInput: { flex: 1, fontSize: 14, color: '#000', paddingVertical: 0 },
  divider: { height: 0.5, backgroundColor: '#dbdbdb', marginHorizontal: 16 },
});

export default EditProfileScreen;
