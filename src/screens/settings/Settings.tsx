import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const SettingsScreen = ({ navigation }: any) => {
  const { logout } = useAuthStore();

  const menuItems = [
    { icon: 'notifications-outline', label: 'Notificaciones', action: () => Alert.alert('Ajustes', 'Función de notificaciones próximamente.') },
    { icon: 'lock-closed-outline', label: 'Privacidad y seguridad', action: () => Alert.alert('Seguridad', 'Configuración de privacidad local activada.') },
    { icon: 'help-circle-outline', label: 'Ayuda', action: () => Alert.alert('Soporte', 'Contacta con soporte en idatgram.help@example.com') },
    { icon: 'information-circle-outline', label: 'Información', action: () => Alert.alert('Idatgram v1.0', 'Proyecto Final de Desarrollo de Sistemas.') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} onPress={item.action} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={22} color="#000" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8e8e8e" />
          </TouchableOpacity>
        ))}

        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuLabel: { fontSize: 15, color: '#000' },
  logoutSection: { paddingHorizontal: 16, paddingVertical: 32 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#ED4956',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#ED4956', fontSize: 15, fontWeight: '600' },
});

export default SettingsScreen;
