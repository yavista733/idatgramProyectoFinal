/**
 * Pantalla de Likes – Funcional
 * Muestra usuarios que dieron like usando likeRepository
 */

import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPostLikeUserIds } from '../../database/likeRepository';
import { getUserById } from '../../database/userRepository';
import type { User } from '../../types';
import { Avatar, LoadingSpinner, EmptyState } from '../../components/UI';

const LikesScreen = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLikes();
  }, [postId]);

  const loadLikes = async () => {
    setIsLoading(true);
    try {
      const userIds = await getPostLikeUserIds(postId, 100);
      const usersData = await Promise.all(userIds.map((uid) => getUserById(uid)));
      setUsers(usersData.filter((u): u is User => u !== null));
    } catch (err) {
      console.error('Error loading likes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Me gusta</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={users}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <Avatar source={item.profileImageUrl} size="md" />
              <TouchableOpacity
                onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
                style={styles.userInfo}
              >
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.followBtn}>
                <Text style={styles.followBtnText}>Seguir</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState icon="heart-outline" title="Sin me gusta" message="Nadie ha dado me gusta a este post" />
          }
        />
      )}
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    gap: 12,
  },
  userInfo: { flex: 1 },
  displayName: { fontSize: 14, fontWeight: '600', color: '#000' },
  username: { fontSize: 13, color: '#8e8e8e', marginTop: 1 },
  followBtn: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  followBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },
});

export default LikesScreen;
