/**
 * Pantalla de Detalle de Post – Con likes y comentarios funcionales
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getById, LocalPost } from '../../database/postRepository';
import { usePostsStore } from '../../store/postsStore';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner, EmptyState } from '../../components/UI';
import { getTimeAgo, formatNumber } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route }: any) => {
  const { postId } = route.params;
  const [post, setPost] = useState<LocalPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const toggleLike = usePostsStore(s => s.toggleLike);
  const loadLikeState = usePostsStore(s => s.loadLikeState);
  const likedPosts = usePostsStore(s => s.likedPosts);
  const likeCounts = usePostsStore(s => s.likeCounts);
  const commentCounts = usePostsStore(s => s.commentCounts);

  useEffect(() => {
    loadPost();
    loadLikeState(postId);
  }, [postId]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const postData = await getById(postId);
      setPost(postData);
    } catch (err) {
      console.warn('Error loading post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!post) {
    return (
      <EmptyState
        icon="image-outline"
        title="Post no encontrado"
        message="Este post no existe o ha sido eliminado"
      />
    );
  }

  const isLiked = likedPosts[postId] ?? false;
  const likeCount = likeCounts[postId] ?? 0;
  const commentCount = commentCounts[postId] ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publicación</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView>
        {/* Image */}
        <Image source={{ uri: post.image_url }} style={styles.postImage} />

        {/* Actions */}
        <View style={styles.actionBar}>
          <View style={styles.actionLeft}>
            <TouchableOpacity onPress={() => toggleLike(postId)}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isLiked ? '#ED4956' : '#000'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => navigation.navigate('Comments', { postId })}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="paper-plane-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.syncBadge}>
            <Ionicons
              name={post.is_synced ? 'cloud-done-outline' : 'cloud-upload-outline'}
              size={16}
              color={post.is_synced ? '#4CAF50' : '#FF9800'}
            />
          </View>
        </View>

        {/* Likes */}
        {likeCount > 0 && (
          <TouchableOpacity
            style={styles.likesRow}
            onPress={() => navigation.navigate('Likes', { postId })}
          >
            <Text style={styles.likesText}>{formatNumber(likeCount)} Me gusta</Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        <View style={styles.infoWrap}>
          {post.description ? (
            <Text style={styles.description}>
              <Text style={styles.descUser}>{user?.username || 'usuario'} </Text>
              {post.description}
            </Text>
          ) : null}

          {/* Comments link */}
          {commentCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId })}>
              <Text style={styles.commentsLink}>Ver los {commentCount} comentarios</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.timestamp}>
            {getTimeAgo(post.created_at)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb',
  },
  headerBtn: { width: 36 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  postImage: { width, height: width, backgroundColor: '#efefef' },
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginLeft: 14, marginRight: 14 },
  syncBadge: { flexDirection: 'row', alignItems: 'center' },
  likesRow: { paddingHorizontal: 14, paddingBottom: 4 },
  likesText: { fontSize: 13, fontWeight: '600', color: '#000' },
  infoWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  description: { fontSize: 14, color: '#000', lineHeight: 20 },
  descUser: { fontWeight: '600' },
  commentsLink: { fontSize: 13, color: '#8e8e8e', marginTop: 6 },
  timestamp: { fontSize: 11, color: '#8e8e8e', marginTop: 6 },
});

export default PostDetailScreen;
