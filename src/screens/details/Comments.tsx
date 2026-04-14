/**
 * Pantalla de Comentarios – Funcional
 * Carga, crea y elimina comentarios desde SQLite
 */

import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePostsStore } from '../../store/postsStore';
import type { CommentWithUser } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Avatar, LoadingSpinner, EmptyState } from '../../components/UI';
import { getTimeAgo } from '../../utils/helpers';

const CommentsScreen = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const user = useAuthStore((state) => state.user);

  const comments = usePostsStore((s) => s.comments[postId] || []);
  const loadComments = usePostsStore((s) => s.loadComments);
  const addComment = usePostsStore((s) => s.addComment);
  const removeComment = usePostsStore((s) => s.removeComment);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadComments(postId);
      setIsLoading(false);
    })();
  }, [postId]);

  const handleSubmit = async () => {
    if (!commentText.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      await addComment(postId, commentText.trim());
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert('Eliminar comentario', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeComment(postId, commentId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentarios</Text>
        <View style={styles.headerBtn} />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Avatar source={item.user?.profileImageUrl} size="sm" />
              <View style={styles.commentContent}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentUsername}>{item.user?.username || 'usuario'} </Text>
                  {item.text}
                </Text>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
                  {user && item.userId === user.id && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text style={styles.deleteBtn}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
              title="Sin comentarios"
              message="Sé el primero en comentar"
            />
          }
        />
      )}

      {/* Comment input */}
      <View style={styles.inputRow}>
        <Avatar source={user?.profileImageUrl} size="sm" />
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Añade un comentario..."
            placeholderTextColor="#8e8e8e"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
        </View>
        <TouchableOpacity onPress={handleSubmit} disabled={!commentText.trim() || isSending}>
          <Text style={[styles.postBtn, (!commentText.trim() || isSending) && styles.postBtnDisabled]}>
            {isSending ? '...' : 'Publicar'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerBtn: { width: 36 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    gap: 10,
  },
  commentContent: { flex: 1 },
  commentUsername: { fontWeight: '600', color: '#000', fontSize: 14 },
  commentText: { fontSize: 14, color: '#000', lineHeight: 20 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
  commentTime: { fontSize: 12, color: '#8e8e8e' },
  deleteBtn: { fontSize: 12, color: '#ED4956', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: '#dbdbdb',
  },
  input: { fontSize: 14, color: '#000', minHeight: 20, maxHeight: 80 },
  postBtn: { color: '#3797EF', fontWeight: '600', fontSize: 14 },
  postBtnDisabled: { opacity: 0.4 },
});

export default CommentsScreen;
