/**
 * Repositorio de Posts – CRUD con expo-sqlite
 * Columnas: id, remote_id, user_id, description, image_url, likes_count, comments_count, is_synced, created_at, updated_at
 */

import { queryDatabase, queryDatabaseOne, executeSql } from './sqlite';

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

/** Obtiene todos los posts ordenados por fecha */
export async function getAll(): Promise<LocalPost[]> {
  return queryDatabase<LocalPost>('SELECT * FROM posts ORDER BY created_at DESC');
}

/** Obtiene posts de un usuario */
export async function getByUserId(userId: string): Promise<LocalPost[]> {
  return queryDatabase<LocalPost>(
    'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
}

/** Obtiene un post por ID */
export async function getById(id: string): Promise<LocalPost | null> {
  return queryDatabaseOne<LocalPost>('SELECT * FROM posts WHERE id = ?', [id]);
}

/** Busca un post por su remote_id */
export async function getByRemoteId(remoteId: string): Promise<LocalPost | null> {
  return queryDatabaseOne<LocalPost>('SELECT * FROM posts WHERE remote_id = ?', [remoteId]);
}

/** Crea un nuevo post con is_synced = 0 */
export async function create(post: Omit<LocalPost, 'remote_id' | 'likes_count' | 'comments_count'> & { remote_id?: string | null; likes_count?: number; comments_count?: number }): Promise<void> {
  await executeSql(
    `INSERT INTO posts (id, remote_id, user_id, description, image_url, likes_count, comments_count, is_synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [post.id, post.remote_id || null as any, post.user_id, post.description, post.image_url, post.likes_count ?? 0, post.comments_count ?? 0, post.is_synced, post.created_at, post.updated_at],
  );
}

/** Elimina un post */
export async function remove(id: string): Promise<void> {
  await executeSql('DELETE FROM posts WHERE id = ?', [id]);
}

/** Obtiene posts no sincronizados (is_synced = 0) */
export async function getUnsynced(): Promise<LocalPost[]> {
  return queryDatabase<LocalPost>('SELECT * FROM posts WHERE is_synced = 0 ORDER BY created_at ASC');
}

/** Marca un post como sincronizado y guarda su remote_id */
export async function markSynced(id: string, remoteId?: string): Promise<void> {
  if (remoteId) {
    await executeSql(
      'UPDATE posts SET is_synced = 1, remote_id = ?, updated_at = ? WHERE id = ?',
      [remoteId, Date.now(), id],
    );
  } else {
    await executeSql(
      'UPDATE posts SET is_synced = 1, updated_at = ? WHERE id = ?',
      [Date.now(), id],
    );
  }
}

/**
 * Upsert inteligente desde el servidor – Sincronización Bidireccional
 * Compara updated_at para decidir si actualizar o no
 */
export async function upsertFromRemote(remotePost: { id: string; user_id: string; description: string; image_url: string; likes_count?: number; comments_count?: number; created_at: number; updated_at: number }): Promise<'inserted' | 'updated' | 'skipped'> {
  // Buscar por remote_id (el id del servidor)
  const localPost = await getByRemoteId(remotePost.id);

  if (!localPost) {
    // No existe localmente → insertar
    await executeSql(
      `INSERT INTO posts (id, remote_id, user_id, description, image_url, likes_count, comments_count, is_synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        `remote-${remotePost.id}`, // ID local generado
        remotePost.id,             // remote_id = UUID de Supabase
        remotePost.user_id,
        remotePost.description || '',
        remotePost.image_url || '',
        remotePost.likes_count ?? 0,
        remotePost.comments_count ?? 0,
        remotePost.created_at,
        remotePost.updated_at,
      ],
    );
    return 'inserted';
  }

  // Existe localmente → comparar updated_at
  if (remotePost.updated_at > localPost.updated_at) {
    // Dato remoto es más nuevo → actualizar local
    await executeSql(
      `UPDATE posts SET description = ?, image_url = ?, likes_count = ?, comments_count = ?, is_synced = 1, updated_at = ? WHERE id = ?`,
      [
        remotePost.description || '',
        remotePost.image_url || '',
        remotePost.likes_count ?? localPost.likes_count,
        remotePost.comments_count ?? localPost.comments_count,
        remotePost.updated_at,
        localPost.id,
      ],
    );
    return 'updated';
  }

  // Dato local es más nuevo o igual → no hacer nada (se subirá en el push)
  return 'skipped';
}

/** Actualiza los contadores de likes y comments */
export async function updatePostCounts(postId: string, likesCount: number, commentsCount: number): Promise<void> {
  await executeSql(
    'UPDATE posts SET likes_count = ?, comments_count = ?, updated_at = ? WHERE id = ?',
    [likesCount, commentsCount, Date.now(), postId],
  );
}

/** Obtiene el conteo de likes de un post */
export async function getLikesCount(postId: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
    [postId],
  );
  return result?.count ?? 0;
}

/** Obtiene el conteo de comentarios de un post */
export async function getCommentsCount(postId: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
    [postId],
  );
  return result?.count ?? 0;
}
