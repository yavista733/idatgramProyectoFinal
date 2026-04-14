/**
 * Pantalla de Perfil
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getByUserId, LocalPost } from '../database/postRepository';
import { Avatar, LoadingSpinner, EmptyState } from '../components/UI';

const { width: W } = Dimensions.get('window');
const CELL = (W - 2) / 3;

const ProfileScreen = ({ navigation }: any) => {
  const [userPosts, setUserPosts] = useState<LocalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'saved'>('grid');
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) loadUserPosts();
  }, [user]);

  const loadUserPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const posts = await getByUserId(user.id);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  const StatItem = ({ value, label, onPress }: any) => (
    <TouchableOpacity style={styles.statItem} onPress={onPress}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.topBarIcon} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Stats */}
      <View style={styles.avatarStatsRow}>
        <View style={styles.avatarWrap}>
          <Avatar source={user.profileImageUrl} size="xl" />
        </View>
        <View style={styles.statsRow}>
          <StatItem value={user.postsCount} label="Posts" />
          <StatItem
            value={user.followersCount}
            label="Seguidores"
            onPress={() => navigation.navigate('Followers', { userId: user.id })}
          />
          <StatItem
            value={user.followingCount}
            label="Siguiendo"
            onPress={() => navigation.navigate('Following', { userId: user.id })}
          />
        </View>
      </View>

      {/* Name + Bio */}
      <View style={styles.bioSection}>
        {user.displayName ? <Text style={styles.displayName}>{user.displayName}</Text> : null}
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        {user.website ? <Text style={styles.website}>{user.website}</Text> : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.btnOutlineText}>Editar perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnOutline, { marginLeft: 8 }]}>
          <Ionicons name="person-add-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
          onPress={() => setActiveTab('grid')}
        >
          <Ionicons name="grid-outline" size={22} color={activeTab === 'grid' ? '#000' : '#8e8e8e'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => navigation.navigate('SavedPosts')}
        >
          <Ionicons name="bookmark-outline" size={22} color="#8e8e8e" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={userPosts}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            style={styles.gridCell}
          >
            <Image source={{ uri: item.image_url }} style={styles.gridImage} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="image-outline" title="Sin publicaciones" message="Cuando publiques fotos, aparecerán aquí." />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadUserPosts} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  profileHeader: { backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  username: { fontSize: 20, fontWeight: '700', color: '#000' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center' },
  topBarIcon: { marginLeft: 16 },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  avatarWrap: { marginRight: 24 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#000' },
  statLabel: { fontSize: 13, color: '#000', marginTop: 2 },
  bioSection: { paddingHorizontal: 14, paddingBottom: 12 },
  displayName: { fontSize: 14, fontWeight: '600', color: '#000' },
  bio: { fontSize: 14, color: '#000', marginTop: 2, lineHeight: 20 },
  website: { fontSize: 14, color: '#3797EF', marginTop: 2 },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: '#000' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1.5,
    borderTopColor: 'transparent',
  },
  tabActive: { borderTopColor: '#000' },
  gridCell: { width: CELL, height: CELL, margin: 0.5, backgroundColor: '#dbdbdb' },
  gridImage: { width: '100%', height: '100%' },
});

export default ProfileScreen;

