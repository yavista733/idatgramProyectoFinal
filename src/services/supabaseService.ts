/**
 * Servicio Supabase – POST y GET a tablas remotas
 * Usa HttpService con timeout de 10 segundos (fetch nativo)
 * Estrategia Last-Write-Wins con comparación de updated_at
 */

import HttpService, { HttpError } from './HttpService';
import { LocalPost } from '../database/postRepository';
import { LocalComment } from '../database/commentRepository';
import { LocalLike } from '../database/likeRepository';
import { User } from '../types';

// ============ POSTS ============

export async function uploadPost(post: LocalPost): Promise<string | null> {
  try {
    const payload: any = {
      id: post.remote_id || post.id,
      user_id: post.user_id,
      description: post.description,
      image_url: post.image_url,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
    };

    const response = await HttpService.post('/posts', payload);
    const remoteId = response.data?.[0]?.id || payload.id;
    console.log(`✅ Supabase POST ok – post ${remoteId.substring(0, 8)}...`);
    return remoteId;
  } catch (error: any) {
    if (error instanceof HttpError && error.status === 409) {
      // Ya existe, intentar PATCH
      try {
        const patchId = post.remote_id || post.id;
        await HttpService.patch(`/posts?id=eq.${patchId}`, {
          description: post.description,
          image_url: post.image_url,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          updated_at: post.updated_at,
        });
        console.log(`✅ Supabase PATCH ok – post ${patchId.substring(0, 8)}...`);
        return patchId;
      } catch (patchErr: any) {
        console.warn('⚠️ Supabase PATCH error:', patchErr?.data || patchErr?.message);
      }
      return post.remote_id || post.id;
    }
    console.warn(`⚠️ Supabase POST error:`, error?.data || error?.message);
    return null;
  }
}

export async function uploadMany(posts: LocalPost[]): Promise<{ localId: string; remoteId: string }[]> {
  const synced: { localId: string; remoteId: string }[] = [];
  for (const p of posts) {
    const remoteId = await uploadPost(p);
    if (remoteId) synced.push({ localId: p.id, remoteId });
  }
  return synced;
}

export async function fetchPosts(limit = 50): Promise<any[]> {
  try {
    const { data, status } = await HttpService.get('/posts', {
      params: { select: '*', order: 'created_at.desc', limit },
    });
    console.log(`✅ Supabase GET ok (status: ${status}) – ${(data || []).length} posts`);
    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      description: row.description || '',
      image_url: row.image_url || '',
      likes_count: row.likes_count || 0,
      comments_count: row.comments_count || 0,
      created_at:
        typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
      updated_at:
        typeof row.updated_at === 'number' ? row.updated_at : new Date(row.updated_at).getTime(),
    }));
  } catch (error: any) {
    console.warn(`⚠️ Supabase GET error:`, error?.data || error?.message);
    return [];
  }
}

export async function deleteRemotePost(postId: string): Promise<boolean> {
  try {
    await HttpService.delete(`/posts?id=eq.${postId}`);
    console.log(`✅ Supabase DELETE ok – post ${postId.substring(0, 8)}...`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ Supabase DELETE error:`, error?.data || error?.message);
    return false;
  }
}

// ============ COMMENTS ============

export async function uploadComment(comment: LocalComment): Promise<string | null> {
  try {
    const payload = {
      id: comment.remote_id || comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };
    const response = await HttpService.post('/comments', payload);
    const remoteId = response.data?.[0]?.id || payload.id;
    console.log(`✅ Supabase POST comment ok – ${remoteId.substring(0, 8)}...`);
    return remoteId;
  } catch (error: any) {
    if (error instanceof HttpError && error.status === 409) return comment.remote_id || comment.id;
    console.warn(`⚠️ Supabase POST comment error:`, error?.data || error?.message);
    return null;
  }
}

export async function fetchComments(postId: string, limit = 100): Promise<any[]> {
  try {
    const { data } = await HttpService.get('/comments', {
      params: { post_id: `eq.${postId}`, select: '*', order: 'created_at.asc', limit },
    });
    return (data || []).map((row: any) => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      text: row.text,
      created_at: typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
      updated_at: typeof row.updated_at === 'number' ? row.updated_at : new Date(row.updated_at).getTime(),
    }));
  } catch (error: any) {
    console.warn(`⚠️ Supabase GET comments error:`, error?.data || error?.message);
    return [];
  }
}

export async function deleteRemoteComment(commentId: string): Promise<boolean> {
  try {
    await HttpService.delete(`/comments?id=eq.${commentId}`);
    return true;
  } catch { return false; }
}

// ============ LIKES ============

export async function uploadLike(like: LocalLike): Promise<string | null> {
  try {
    const payload = {
      id: like.remote_id || like.id,
      post_id: like.post_id,
      user_id: like.user_id,
      created_at: like.created_at,
    };
    const response = await HttpService.post('/likes', payload);
    const remoteId = response.data?.[0]?.id || payload.id;
    return remoteId;
  } catch (error: any) {
    if (error instanceof HttpError && error.status === 409) return like.remote_id || like.id;
    console.warn(`⚠️ Supabase POST like error:`, error?.data || error?.message);
    return null;
  }
}

export async function fetchLikes(postId: string, limit = 200): Promise<any[]> {
  try {
    const { data } = await HttpService.get('/likes', {
      params: { post_id: `eq.${postId}`, select: '*', order: 'created_at.desc', limit },
    });
    return (data || []).map((row: any) => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      created_at: typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
    }));
  } catch (error: any) {
    console.warn(`⚠️ Supabase GET likes error:`, error?.data || error?.message);
    return [];
  }
}

export async function deleteRemoteLike(postId: string, userId: string): Promise<boolean> {
  try {
    await HttpService.delete(`/likes?post_id=eq.${postId}&user_id=eq.${userId}`);
    return true;
  } catch { return false; }
}

// ============ USERS ============

export async function uploadUser(user: User): Promise<boolean> {
  try {
    const response = await HttpService.post('/users', {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.displayName,
      bio: user.bio || '',
      profile_image_url: user.profileImageUrl || '',
      followers_count: user.followersCount || 0,
      following_count: user.followingCount || 0,
      posts_count: user.postsCount || 0,
      is_verified: user.isVerified ? 1 : 0,
      is_private: user.isPrivate ? 1 : 0,
      website: user.website || '',
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
    console.log(`✅ Supabase POST ok – user ${user.username} (status: ${response.status})`);
    return true;
  } catch (error: any) {
    if (error instanceof HttpError && error.status === 409) {
      console.log(`ℹ️ User ${user.username} ya existe en Supabase (409)`);
      return true;
    }
    console.warn(`⚠️ Supabase POST user error:`, error?.data || error?.message);
    return false;
  }
}

export async function fetchUsers(limit = 50): Promise<User[]> {
  try {
    const { data, status } = await HttpService.get('/users', {
      params: { select: '*', order: 'created_at.desc', limit },
    });
    console.log(`✅ Supabase GET users ok (status: ${status}) – ${(data || []).length} users`);
    return (data || []).map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      bio: row.bio || '',
      profileImageUrl: row.profile_image_url || '',
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      postsCount: row.posts_count || 0,
      isVerified: row.is_verified === 1 || row.is_verified === true,
      isPrivate: row.is_private === 1 || row.is_private === true,
      website: row.website || '',
      createdAt: typeof row.created_at === 'number' ? row.created_at : new Date(row.created_at).getTime(),
      updatedAt: typeof row.updated_at === 'number' ? row.updated_at : new Date(row.updated_at).getTime(),
    }));
  } catch (error: any) {
    console.warn(`⚠️ Supabase GET users error:`, error?.data || error?.message);
    return [];
  }
}
