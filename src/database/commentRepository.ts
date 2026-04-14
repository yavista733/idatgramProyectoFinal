/**
 * Repositorio de Comentarios – CRUD con expo-sqlite
 * Columnas: id, remote_id, post_id, user_id, text, is_synced, created_at, updated_at
 */

import { queryDatabase, queryDatabaseOne, executeSql } from './sqlite';
import { getUserById } from './userRepository';
import type { CommentWithUser } from '../types';

export interface LocalComment {
  id: string;
  remote_id: string | null;
  post_id: string;
  user_id: string;
  text: string;
  is_synced: number;
  created_at: number;
  updated_at: number;
}

/** Obtiene comentarios de un post con datos del usuario */
export async function getPostComments(postId: string, _userId: string, limit = 50): Promise<CommentWithUser[]> {
  const comments = await queryDatabase<LocalComment>(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT ?',
    [postId, limit],
  );

  const result: CommentWithUser[] = [];
  for (const c of comments) {
    const user = await getUserById(c.user_id);
    if (user) {
      result.push({
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        text: c.text,
        likesCount: 0,
        repliesCount: 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        user,
        isLiked: false,
      });
    }
  }
  return result;
}

/** Crea un nuevo comentario */
export async function createComment(comment: LocalComment): Promise<void> {
  await executeSql(
    `INSERT INTO comments (id, remote_id, post_id, user_id, text, is_synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [comment.id, comment.remote_id as any, comment.post_id, comment.user_id, comment.text, comment.is_synced, comment.created_at, comment.updated_at],
  );
}

/** Elimina un comentario */
export async function deleteComment(commentId: string): Promise<void> {
  await executeSql('DELETE FROM comments WHERE id = ?', [commentId]);
}

/** Obtiene comentarios no sincronizados */
export async function getUnsyncedComments(): Promise<LocalComment[]> {
  return queryDatabase<LocalComment>('SELECT * FROM comments WHERE is_synced = 0 ORDER BY created_at ASC');
}

/** Marca un comentario como sincronizado */
export async function markCommentSynced(id: string, remoteId?: string): Promise<void> {
  if (remoteId) {
    await executeSql('UPDATE comments SET is_synced = 1, remote_id = ? WHERE id = ?', [remoteId, id]);
  } else {
    await executeSql('UPDATE comments SET is_synced = 1 WHERE id = ?', [id]);
  }
}

/** Upsert inteligente desde servidor con comparación de updated_at */
export async function upsertCommentFromRemote(remote: { id: string; post_id: string; user_id: string; text: string; created_at: number; updated_at: number }): Promise<'inserted' | 'updated' | 'skipped'> {
  const local = await queryDatabaseOne<LocalComment>('SELECT * FROM comments WHERE remote_id = ?', [remote.id]);

  if (!local) {
    await executeSql(
      `INSERT INTO comments (id, remote_id, post_id, user_id, text, is_synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [`remote-c-${remote.id}`, remote.id, remote.post_id, remote.user_id, remote.text, remote.created_at, remote.updated_at],
    );
    return 'inserted';
  }

  if (remote.updated_at > local.updated_at) {
    await executeSql(
      'UPDATE comments SET text = ?, is_synced = 1, updated_at = ? WHERE id = ?',
      [remote.text, remote.updated_at, local.id],
    );
    return 'updated';
  }

  return 'skipped';
}

/** Obtiene el conteo de comentarios de un post */
export async function getCommentCount(postId: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
    [postId],
  );
  return result?.count ?? 0;
}
