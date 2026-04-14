/**
 * Pantalla de Siguiendo
 */

import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFollowing } from '../../database/userRepository';
import type { User } from '../../types';
import { Avatar, LoadingSpinner, EmptyState } from '../../components/UI';

const FollowingScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    setIsLoading(true);
    try {
      const data = await getFollowing(userId, 50);
      setFollowing(data);
    } catch (err) {
      console.error('Error:', err);
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
        <Text style={styles.headerTitle}>Siguiendo</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={following}
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
              <TouchableOpacity style={styles.followingBtn}>
                <Text style={styles.followingBtnText}>Siguiendo</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="Sin seguidos" message="Aún no sigues a nadie" />
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
  followingBtn: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#efefef',
  },
  followingBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },
});

export default FollowingScreen;
