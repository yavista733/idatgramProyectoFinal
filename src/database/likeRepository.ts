/**
 * Repositorio de Likes – CRUD con expo-sqlite
 * Columnas: id, remote_id, post_id, user_id, is_synced, created_at
 */

import { queryDatabase, queryDatabaseOne, executeSql } from './sqlite';

export interface LocalLike {
  id: string;
  remote_id: string | null;
  post_id: string;
  user_id: string;
  is_synced: number;
  created_at: number;
}

/** Verifica si un usuario ya dio like a un post */
export async function hasUserLiked(postId: string, userId: string): Promise<boolean> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM likes WHERE post_id = ? AND user_id = ?',
    [postId, userId],
  );
  return (result?.count ?? 0) > 0;
}

/** Agrega un like */
export async function addLike(like: LocalLike): Promise<void> {
  await executeSql(
    `INSERT OR IGNORE INTO likes (id, remote_id, post_id, user_id, is_synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [like.id, like.remote_id as any, like.post_id, like.user_id, like.is_synced, like.created_at],
  );
}

/** Elimina un like */
export async function removeLike(postId: string, userId: string): Promise<void> {
  await executeSql(
    'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
    [postId, userId],
  );
}

/** Obtiene el conteo de likes de un post */
export async function getLikeCount(postId: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
    [postId],
  );
  return result?.count ?? 0;
}

/** Obtiene los user_ids que dieron like a un post */
export async function getPostLikeUserIds(postId: string, limit = 50): Promise<string[]> {
  const rows = await queryDatabase<{ user_id: string }>(
    'SELECT user_id FROM likes WHERE post_id = ? ORDER BY created_at DESC LIMIT ?',
    [postId, limit],
  );
  return rows.map((r) => r.user_id);
}

/** Obtiene likes no sincronizados */
export async function getUnsyncedLikes(): Promise<LocalLike[]> {
  return queryDatabase<LocalLike>('SELECT * FROM likes WHERE is_synced = 0 ORDER BY created_at ASC');
}

/** Marca un like como sincronizado */
export async function markLikeSynced(id: string, remoteId?: string): Promise<void> {
  if (remoteId) {
    await executeSql('UPDATE likes SET is_synced = 1, remote_id = ? WHERE id = ?', [remoteId, id]);
  } else {
    await executeSql('UPDATE likes SET is_synced = 1 WHERE id = ?', [id]);
  }
}

/** Upsert desde servidor */
export async function upsertLikeFromRemote(remote: { id: string; post_id: string; user_id: string; created_at: number }): Promise<'inserted' | 'skipped'> {
  const existing = await queryDatabaseOne<LocalLike>('SELECT * FROM likes WHERE remote_id = ?', [remote.id]);

  if (!existing) {
    // También verificar por post_id + user_id para no duplicar
    const existsByPair = await hasUserLiked(remote.post_id, remote.user_id);
    if (!existsByPair) {
      await executeSql(
        `INSERT INTO likes (id, remote_id, post_id, user_id, is_synced, created_at)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [`remote-l-${remote.id}`, remote.id, remote.post_id, remote.user_id, remote.created_at],
      );
      return 'inserted';
    }
  }

  return 'skipped';
}

/** Obtiene los likes eliminados localmente (que tenían remote_id pero ya no existen) */
export async function getDeletedLikeRemoteIds(postId: string, remoteIds: string[]): Promise<string[]> {
  if (remoteIds.length === 0) return [];
  const localLikes = await queryDatabase<{ remote_id: string }>(
    'SELECT remote_id FROM likes WHERE post_id = ? AND remote_id IS NOT NULL',
    [postId],
  );
  const localRemoteIds = new Set(localLikes.map((l) => l.remote_id));
  return remoteIds.filter((rid) => !localRemoteIds.has(rid));
}
