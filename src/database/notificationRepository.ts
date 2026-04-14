/**
 * Repositorio de Notificaciones
 * Maneja todas las operaciones CRUD para notificaciones
 */

import { Notification } from '../types';
import { queryDatabase, queryDatabaseOne, executeSql } from './sqlite';

/**
 * Obtiene una notificación por ID
 */
export async function getNotificationById(notificationId: string): Promise<Notification | null> {
  return queryDatabaseOne<Notification>(
    'SELECT * FROM notifications WHERE id = ?',
    [notificationId]
  );
}

/**
 * Crea una nueva notificación
 */
export async function createNotification(notification: Notification): Promise<void> {
  const sql = `
    INSERT INTO notifications (
      id, userId, type, fromUserId, postId, commentId, text, isRead, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    notification.id,
    notification.userId,
    notification.type,
    notification.fromUserId,
    notification.postId || '',
    notification.commentId || '',
    notification.text,
    notification.isRead ? 1 : 0,
    notification.createdAt,
  ]);
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
  const notifications = await queryDatabase<any>(
    `SELECT * FROM notifications 
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return notifications.map(n => ({
    ...n,
    isRead: Boolean(n.isRead),
  }));
}

/**
 * Obtiene las notificaciones no leídas de un usuario
 */
export async function getUnreadNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  const notifications = await queryDatabase<any>(
    `SELECT * FROM notifications 
     WHERE userId = ? AND isRead = 0
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, limit]
  );

  return notifications.map(n => ({
    ...n,
    isRead: Boolean(n.isRead),
  }));
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0',
    [userId]
  );
  return result?.count ?? 0;
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const sql = 'UPDATE notifications SET isRead = 1 WHERE id = ?';
  await executeSql(sql, [notificationId]);
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const sql = 'UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0';
  await executeSql(sql, [userId]);
}

/**
 * Deleta una notificación
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const sql = 'DELETE FROM notifications WHERE id = ?';
  await executeSql(sql, [notificationId]);
}

/**
 * Deleta todas las notificaciones de un usuario
 */
export async function deleteAllUserNotifications(userId: string): Promise<void> {
  const sql = 'DELETE FROM notifications WHERE userId = ?';
  await executeSql(sql, [userId]);
}

/**
 * Obtiene notificaciones de un tipo específico
 */
export async function getNotificationsByType(
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'mention',
  limit: number = 50
): Promise<Notification[]> {
  const notifications = await queryDatabase<any>(
    `SELECT * FROM notifications 
     WHERE userId = ? AND type = ?
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, type, limit]
  );

  return notifications.map(n => ({
    ...n,
    isRead: Boolean(n.isRead),
  }));
}

/**
 * Obtiene notificaciones relacionadas a un post
 */
export async function getPostNotifications(userId: string, postId: string): Promise<Notification[]> {
  const notifications = await queryDatabase<any>(
    `SELECT * FROM notifications 
     WHERE userId = ? AND postId = ?
     ORDER BY createdAt DESC`,
    [userId, postId]
  );

  return notifications.map(n => ({
    ...n,
    isRead: Boolean(n.isRead),
  }));
}

/**
 * Verifica si una notificación de tipo existe
 */
export async function notificationExists(
  userId: string,
  type: string,
  fromUserId: string,
  postId?: string,
  commentId?: string
): Promise<boolean> {
  const result = await queryDatabaseOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM notifications 
     WHERE userId = ? AND type = ? AND fromUserId = ? 
     AND postId ${postId ? '= ?' : 'IS NULL'}
     AND commentId ${commentId ? '= ?' : 'IS NULL'}`,
    [userId, type, fromUserId, postId, commentId].filter(v => v !== undefined)
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Limpia notificaciones antiguas (más de N días)
 */
export async function cleanOldNotifications(daysThreshold: number = 30): Promise<number> {
  const now = Date.now();
  const threshold = now - (daysThreshold * 24 * 60 * 60 * 1000);

  const q = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE createdAt <= ?',
    [threshold]
  );
  
  const count = q?.count ?? 0;
  
  if (count > 0) {
    await executeSql(
      'DELETE FROM notifications WHERE createdAt <= ?',
      [threshold]
    );
  }

  return count;
}
