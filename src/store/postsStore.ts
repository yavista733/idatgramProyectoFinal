/**
 * PostsStore – Zustand
 * Vincula SQLite local + sync con Supabase
 * Incluye funcionalidad de likes y comentarios
 */

import { create } from 'zustand';
import {
  LocalPost,
  getAll,
  create as createLocal,
  remove as removeLocal,
  markSynced,
} from '../database/postRepository';
import {
  hasUserLiked,
  addLike,
  removeLike,
  getLikeCount,
  getPostLikeUserIds,
} from '../database/likeRepository';
import {
  getPostComments,
  createComment,
  deleteComment as deleteCommentRepo,
  getCommentCount,
} from '../database/commentRepository';
import type { LocalComment } from '../database/commentRepository';
import type { CommentWithUser } from '../types';
import { useAuthStore } from './authStore';
import { syncPosts } from '../services/syncService';
import { generateId } from '../utils/helpers';

interface PostsStore {
  posts: LocalPost[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Likes state per post
  likedPosts: Record<string, boolean>;
  likeCounts: Record<string, number>;

  // Comments state per post
  commentCounts: Record<string, number>;
  comments: Record<string, CommentWithUser[]>;

  loadPosts: () => Promise<void>;
  addPost: (description: string, imageUrl: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  syncWithRemote: () => Promise<void>;

  // Likes
  toggleLike: (postId: string) => Promise<void>;
  loadLikeState: (postId: string) => Promise<void>;

  // Comments
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
}

export const usePostsStore = create<PostsStore>((set, get) => ({
  posts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  likedPosts: {},
  likeCounts: {},
  commentCounts: {},
  comments: {},

  /**
   * Offline-First: SIEMPRE carga primero de SQLite (inmediato),
   * luego sincroniza en segundo plano si hay red (no bloquea UI)
   */
  loadPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. SIEMPRE cargar primero desde SQLite (Offline-First)
      const posts = await getAll();

      // Cargar contadores y estado de likes para cada post
      const user = useAuthStore.getState().user;
      const likedPosts: Record<string, boolean> = {};
      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};

      for (const post of posts) {
        if (user) {
          likedPosts[post.id] = await hasUserLiked(post.id, user.id);
        }
        likeCounts[post.id] = await getLikeCount(post.id);
        commentCounts[post.id] = await getCommentCount(post.id);
      }

      set({ posts, isLoading: false, likedPosts, likeCounts, commentCounts });

      // 2. Sincronizar en segundo plano (sin bloquear la UI)
      // Si hay red, descarga datos remotos y recarga si hay cambios
      syncPosts()
        .then(async (result) => {
          if (result.uploaded > 0 || result.downloaded > 0) {
            // Recargar desde SQLite para mostrar datos sincronizados
            const updatedPosts = await getAll();
            const updatedLikedPosts: Record<string, boolean> = {};
            const updatedLikeCounts: Record<string, number> = {};
            const updatedCommentCounts: Record<string, number> = {};

            for (const post of updatedPosts) {
              if (user) {
                updatedLikedPosts[post.id] = await hasUserLiked(post.id, user.id);
              }
              updatedLikeCounts[post.id] = await getLikeCount(post.id);
              updatedCommentCounts[post.id] = await getCommentCount(post.id);
            }

            set({
              posts: updatedPosts,
              likedPosts: updatedLikedPosts,
              likeCounts: updatedLikeCounts,
              commentCounts: updatedCommentCounts,
            });
            console.log('📱 Posts actualizados desde sync en segundo plano');
          }
        })
        .catch((err) => {
          console.warn('⚠️ Sync en segundo plano falló (app sigue funcionando offline):', err?.message || err);
        });
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Error cargando posts' });
    }
  },

  addPost: async (description: string, imageUrl: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isSubmitting: true, error: null });

    const now = Date.now();
    const post = {
      id: generateId(),
      user_id: user.id,
      description,
      image_url: imageUrl,
      is_synced: 0,
      created_at: now,
      updated_at: now,
    };

    try {
      await createLocal(post);
      await get().loadPosts();

      const result = await syncPosts();

      if (result.uploaded > 0) {
        await get().loadPosts();
      }

      set({ isSubmitting: false });
    } catch (e: any) {
      console.warn('⚠️ Error en addPost:', e?.message || e);
      set({ isSubmitting: false, error: e.message || 'Error al crear post' });
    }
  },

  deletePost: async (id: string) => {
    await removeLocal(id);
    set({ posts: get().posts.filter((p) => p.id !== id) });
  },

  syncWithRemote: async () => {
    try {
      const result = await syncPosts();
      if (result.uploaded > 0 || result.downloaded > 0) {
        await get().loadPosts();
      }
    } catch (e: any) {
      console.warn('⚠️ Error en syncWithRemote:', e?.message || e);
    }
  },

  // ============ LIKES ============

  toggleLike: async (postId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isLiked = get().likedPosts[postId] ?? false;
    const currentCount = get().likeCounts[postId] ?? 0;

    if (isLiked) {
      // Quitar like
      await removeLike(postId, user.id);
      set({
        likedPosts: { ...get().likedPosts, [postId]: false },
        likeCounts: { ...get().likeCounts, [postId]: Math.max(0, currentCount - 1) },
      });
    } else {
      // Dar like
      const now = Date.now();
      await addLike({
        id: generateId(),
        remote_id: null,
        post_id: postId,
        user_id: user.id,
        is_synced: 0,
        created_at: now,
      });
      set({
        likedPosts: { ...get().likedPosts, [postId]: true },
        likeCounts: { ...get().likeCounts, [postId]: currentCount + 1 },
      });
    }
  },

  loadLikeState: async (postId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isLiked = await hasUserLiked(postId, user.id);
    const count = await getLikeCount(postId);

    set({
      likedPosts: { ...get().likedPosts, [postId]: isLiked },
      likeCounts: { ...get().likeCounts, [postId]: count },
    });
  },

  // ============ COMMENTS ============

  loadComments: async (postId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const data = await getPostComments(postId, user.id, 100);
      const count = await getCommentCount(postId);
      set({
        comments: { ...get().comments, [postId]: data },
        commentCounts: { ...get().commentCounts, [postId]: count },
      });
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  },

  addComment: async (postId: string, text: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const now = Date.now();
    const comment: LocalComment = {
      id: generateId(),
      remote_id: null,
      post_id: postId,
      user_id: user.id,
      text,
      is_synced: 0,
      created_at: now,
      updated_at: now,
    };

    await createComment(comment);

    // Recargar comentarios para este post
    await get().loadComments(postId);
  },

  removeComment: async (postId: string, commentId: string) => {
    await deleteCommentRepo(commentId);
    await get().loadComments(postId);
  },
}));
