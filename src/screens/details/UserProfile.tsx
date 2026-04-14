/**
 * Pantalla de Perfil de Usuario
 */

import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Image, RefreshControl, Text, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '../../database/userRepository';
import { getByUserId, LocalPost } from '../../database/postRepository';
import { useAuthStore } from '../../store/authStore';
import { Avatar, LoadingSpinner, EmptyState } from '../../components/UI';

const { width } = Dimensions.get('window');
const CELL = (width - 2) / 3;

const UserProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<LocalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser) loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfile(userId, currentUser.id);
      if (profile) {
        setUserProfile(profile);
        const posts = await getByUserId(userId);
        setUserPosts(posts);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !userProfile) return <LoadingSpinner />;

  const StatItem = ({ value, label, onPress }: any) => (
    <TouchableOpacity style={styles.statItem} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Avatar + stats row */}
      <View style={styles.avatarStatsRow}>
        <Avatar source={userProfile.profileImageUrl} size="xl" />
        <View style={styles.statsRow}>
          <StatItem value={userProfile.postsCount ?? 0} label="Publicaciones" />
          <StatItem
            value={userProfile.followersCount ?? 0}
            label="Seguidores"
            onPress={() => navigation.navigate('Followers', { userId })}
          />
          <StatItem
            value={userProfile.followingCount ?? 0}
            label="Siguiendo"
            onPress={() => navigation.navigate('Following', { userId })}
          />
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{userProfile.displayName}</Text>
        {userProfile.bio ? <Text style={styles.bio}>{userProfile.bio}</Text> : null}
        {userProfile.website ? <Text style={styles.website}>{userProfile.website}</Text> : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={userProfile.isFollowing ? styles.btnSecondary : styles.btnPrimary}>
          <Text style={userProfile.isFollowing ? styles.btnSecondaryText : styles.btnPrimaryText}>
            {userProfile.isFollowing ? 'Siguiendo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSecondary, { flex: 0, paddingHorizontal: 14 }]}>
          <Ionicons name="person-add-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Grid tab */}
      <View style={styles.tabBar}>
        <View style={styles.tabActive}>
          <Ionicons name="grid-outline" size={22} color="#000" />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top nav bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36 }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.username}>{userProfile.username}</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={userPosts}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            style={styles.cell}
          >
            <Image source={{ uri: item.image_url }} style={styles.cellImage} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="image-outline"
            title="Sin publicaciones"
            message="Este usuario aún no ha publicado nada"
          />
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadUserProfile} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  username: { fontSize: 16, fontWeight: '700', color: '#000' },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#000' },
  statLabel: { fontSize: 12, color: '#000', marginTop: 2 },
  bioSection: { paddingHorizontal: 16, paddingBottom: 12 },
  displayName: { fontSize: 14, fontWeight: '700', color: '#000' },
  bio: { fontSize: 14, color: '#000', marginTop: 2, lineHeight: 18 },
  website: { fontSize: 14, color: '#3797EF', marginTop: 2 },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#000', fontWeight: '600', fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#dbdbdb',
    marginTop: 4,
  },
  tabActive: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1.5,
    borderTopColor: '#000',
  },
  cell: {
    width: CELL,
    height: CELL,
    margin: 0.5,
    backgroundColor: '#efefef',
  },
  cellImage: { width: '100%', height: '100%' },
});

export default UserProfileScreen;
