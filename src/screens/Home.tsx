import React, { useEffect, useCallback } from 'react';
import {
  View, FlatList, RefreshControl, Image,
  TouchableOpacity, Text, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePostsStore } from '../store/postsStore';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore } from '../store/connectivityStore';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { getTimeAgo, formatNumber } from '../utils/helpers';

const { width: W } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const posts = usePostsStore(s => s.posts);
  const isLoading = usePostsStore(s => s.isLoading);
  const loadPosts = usePostsStore(s => s.loadPosts);
  const syncWithRemote = usePostsStore(s => s.syncWithRemote);
  const deletePost = usePostsStore(s => s.deletePost);
  const toggleLike = usePostsStore(s => s.toggleLike);
  const likedPosts = usePostsStore(s => s.likedPosts);
  const likeCounts = usePostsStore(s => s.likeCounts);
  const commentCounts = usePostsStore(s => s.commentCounts);
  const currentUser = useAuthStore(s => s.user);

  // Estado global de conectividad
  const isOnline = useConnectivityStore(s => s.isOnline);
  const isSyncing = useConnectivityStore(s => s.isSyncing);

  useEffect(() => {
    loadPosts();
    syncWithRemote();
  }, []);

  const handleRefresh = useCallback(async () => {
    await syncWithRemote();
  }, []);

  const pendingCount = posts.filter(p => !p.is_synced).length;

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
  };

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = likedPosts[item.id] ?? false;
    const likeCount = likeCounts[item.id] ?? 0;
    const commentCount = commentCounts[item.id] ?? 0;

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#999" />
            </View>
            <View>
              <Text style={styles.username}>{currentUser?.username || 'usuario'}</Text>
              <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => deletePost(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ED4956" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {item.image_url ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.postImage, styles.postImagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color="#dbdbdb" />
          </View>
        )}

        {/* Actions */}
        <View style={styles.postActions}>
          <View style={styles.postActionsLeft}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isLiked ? '#ED4956' : '#000'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Comments', { postId: item.id })}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="paper-plane-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.syncBadge}>
            <Ionicons
              name={item.is_synced ? 'cloud-done-outline' : 'cloud-upload-outline'}
              size={16}
              color={item.is_synced ? '#4CAF50' : '#FF9800'}
            />
            <Text style={[styles.syncText, { color: item.is_synced ? '#4CAF50' : '#FF9800' }]}>
              {item.is_synced ? 'Sync' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {/* Likes count */}
        {likeCount > 0 && (
          <TouchableOpacity
            style={styles.likesRow}
            onPress={() => navigation.navigate('Likes', { postId: item.id })}
          >
            <Text style={styles.likesText}>
              {formatNumber(likeCount)} {likeCount === 1 ? 'Me gusta' : 'Me gusta'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        {item.description ? (
          <View style={styles.postInfo}>
            <Text style={styles.postDescription}>
              <Text style={styles.postDescUser}>{currentUser?.username || 'usuario'} </Text>
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Comments count */}
        {commentCount > 0 && (
          <TouchableOpacity
            style={styles.commentsLink}
            onPress={() => navigation.navigate('Comments', { postId: item.id })}
          >
            <Text style={styles.commentsLinkText}>
              Ver los {commentCount} comentarios
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading && posts.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>idatgram</Text>
        <View style={styles.navIcons}>
          {/* Indicador de conexión global */}
          <View style={styles.connectionBadge}>
            <View style={[styles.connectionDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }]} />
            <Text style={styles.connectionText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {isSyncing && (
              <Text style={styles.syncingText}>⟳</Text>
            )}
            {pendingCount > 0 && (
              <Text style={styles.pendingText}>({pendingCount})</Text>
            )}
          </View>
          <TouchableOpacity style={styles.navIcon}>
            <Ionicons name="heart-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}>
            <Ionicons name="paper-plane-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts.filter((post) => post.user_id === currentUser?.id)}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="Sin posts"
            message="Crea tu primer post con el botón de cámara."
          />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb',
  },
  logo: { fontSize: 24, fontWeight: '700', color: '#000', fontStyle: 'italic', letterSpacing: -0.5 },
  navIcons: { flexDirection: 'row', alignItems: 'center' },
  navIcon: { marginLeft: 18 },
  connectionBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 8, backgroundColor: '#fafafa', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  connectionText: { fontSize: 11, fontWeight: '600', color: '#333' },
  syncingText: { fontSize: 12, marginLeft: 4, color: '#3797EF' },
  pendingText: { fontSize: 10, color: '#FF9800', marginLeft: 4 },
  postCard: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb' },
  postHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#efefef',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  username: { fontSize: 13, fontWeight: '600', color: '#000' },
  timeAgo: { fontSize: 11, color: '#8e8e8e' },
  postImage: { width: W, height: W },
  postImagePlaceholder: { backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  postActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postActionsLeft: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { marginRight: 16 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncText: { fontSize: 11, fontWeight: '500' },
  likesRow: { paddingHorizontal: 12, paddingBottom: 4 },
  likesText: { fontSize: 13, fontWeight: '600', color: '#000' },
  postInfo: { paddingHorizontal: 12, paddingBottom: 6 },
  postDescription: { fontSize: 13, color: '#000', lineHeight: 18 },
  postDescUser: { fontWeight: '600' },
  commentsLink: { paddingHorizontal: 12, paddingBottom: 12 },
  commentsLinkText: { fontSize: 13, color: '#8e8e8e' },
});

export default HomeScreen;
