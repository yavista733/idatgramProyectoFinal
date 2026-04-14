/**
 * Tipos e interfaces para la aplicación Idatgram
 * Coinciden con las columnas de SQLite y Supabase
 * TODOS los modelos incluyen remote_id y updated_at (requisito de evaluación)
 */

// ============ Usuario ============
export interface User {
  id: string;
  remote_id?: string | null;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  website: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile extends User {
  isFollowing: boolean;
  isFollowedBy: boolean;
  mutualFollowersCount: number;
}

export interface UserFollow {
  followerId: string;
  followingId: string;
  createdAt: number;
}

// ============ Post (LocalPost - coincide con SQLite y Supabase) ============
export interface LocalPost {
  id: string;
  remote_id: string | null;
  user_id: string;
  description: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  is_synced: number;
  created_at: number;
  updated_at: number;
}

export type Post = LocalPost;

// ============ Comentario ============
export interface Comment {
  id: string;
  remote_id?: string | null;
  postId: string;
  userId: string;
  text: string;
  likesCount: number;
  repliesCount: number;
  parentCommentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommentWithUser extends Comment {
  user: User;
  isLiked: boolean;
  replies?: CommentWithUser[];
}

// ============ Like ============
export interface Like {
  id: string;
  remote_id?: string | null;
  postId: string;
  userId: string;
  createdAt: number;
  updatedAt?: number;
}

// ============ Historia ============
export interface Story {
  id: string;
  remote_id?: string | null;
  userId: string;
  imageUrl: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  viewsCount: number;
  expiresAt: number;
  createdAt: number;
  updatedAt?: number;
}

export interface UserStories {
  user: User;
  stories: Story[];
  hasUnviewedStories: boolean;
}

// ============ Notificación ============
export interface Notification {
  id: string;
  remote_id?: string | null;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUserId: string;
  postId?: string;
  commentId?: string;
  text: string;
  isRead: boolean;
  createdAt: number;
  updatedAt?: number;
}

// ============ Autenticación ============
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// ============ Estados UI ============
export interface SearchState {
  query: string;
  results: User[];
  isLoading: boolean;
  error: string | null;
}

export interface StoriesState {
  stories: UserStories[];
  isLoading: boolean;
  error: string | null;
}

export interface ActivityState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

// ============ Sync ============
export interface SyncResult {
  uploaded: number;
  downloaded: number;
  online: boolean;
}

// ============ Respuestas de API (fetch nativo) ============
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface SupabaseResponse<T = any> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  status: number;
}
