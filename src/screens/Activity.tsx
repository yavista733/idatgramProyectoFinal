/**
 * Pantalla de Actividad
 */

import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivityStore } from '../store/activityStore';
import { Avatar, EmptyState, LoadingSpinner } from '../components/UI';

const ActivityScreen = ({ navigation }: any) => {
  const { notifications, isLoading, loadNotifications, markAsRead } = useActivityStore();

  useEffect(() => { loadNotifications(); }, []);

  const iconForType = (type: string): any => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      default: return 'notifications';
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.row, !item.isRead && styles.rowUnread]}
      onPress={() => {
        if (!item.isRead) markAsRead(item.id);
        if (item.postId) navigation.navigate('PostDetail', { postId: item.postId });
        else if (item.type === 'follow') navigation.navigate('UserProfile', { userId: item.fromUserId });
      }}
    >
      <Avatar source={item.fromUser?.profileImageUrl ?? ''} size="md" />
      <View style={styles.rowContent}>
        <Text style={styles.rowText}>{item.text}</Text>
        <Text style={styles.rowTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.rowRight}>
        <Ionicons name={iconForType(item.type)} size={20} color={item.type === 'like' ? '#ED4956' : '#3797EF'} />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && notifications.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividad</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Sin notificaciones"
            message="Aquí verás me gustas, comentarios y más"
          />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadNotifications()} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb', backgroundColor: '#fff' },
  rowUnread: { backgroundColor: '#fafafa' },
  rowContent: { flex: 1, marginHorizontal: 10 },
  rowText: { fontSize: 13, color: '#000', lineHeight: 18 },
  rowTime: { fontSize: 12, color: '#8e8e8e', marginTop: 3 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3797EF' },
});

export default ActivityScreen;

