/**
 * Repositorio de Historias
 * Maneja todas las operaciones CRUD para historias y sus vistas
 */

import { Story, UserStories, User } from '../types';
import { queryDatabase, queryDatabaseOne, executeSql, beginTransaction, commitTransaction, rollbackTransaction } from './sqlite';
import { getUserById } from './userRepository';

interface StoryWithUser extends Story {
  user: User;
  isViewed: boolean;
  isExpired: boolean;
}

/**
 * Obtiene una historia por ID
 */
export async function getStoryById(storyId: string): Promise<Story | null> {
  return queryDatabaseOne<Story>(
    'SELECT * FROM stories WHERE id = ?',
    [storyId]
  );
}

/**
 * Obtiene una historia con información del usuario
 */
export async function getStoryWithUser(storyId: string, viewerId: string): Promise<StoryWithUser | null> {
  const story = await getStoryById(storyId);
  if (!story) return null;

  const user = await getUserById(story.userId);
  if (!user) return null;

  const isViewed = await isStoryViewed(storyId, viewerId);
  const isExpired = Date.now() > story.expiresAt;

  return {
    ...story,
    user,
    isViewed,
    isExpired,
  };
}

/**
 * Crea una nueva historia
 */
export async function createStory(story: Story): Promise<void> {
  const sql = `
    INSERT INTO stories (
      id, userId, imageUrl, text, backgroundColor, 
      textColor, viewsCount, expiresAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    story.id,
    story.userId,
    story.imageUrl,
    story.text,
    story.backgroundColor,
    story.textColor,
    story.viewsCount,
    story.expiresAt,
    story.createdAt,
  ]);
}

/**
 * Actualiza una historia
 */
export async function updateStory(storyId: string, updates: Partial<Story>): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.text !== undefined) {
    fields.push('text = ?');
    values.push(updates.text);
  }
  if (updates.viewsCount !== undefined) {
    fields.push('viewsCount = ?');
    values.push(updates.viewsCount);
  }

  if (fields.length === 0) return;

  values.push(storyId);
  const sql = `UPDATE stories SET ${fields.join(', ')} WHERE id = ?`;
  await executeSql(sql, values);
}

/**
 * Deleta una historia
 */
export async function deleteStory(storyId: string): Promise<void> {
  const sql = 'DELETE FROM stories WHERE id = ?';
  await executeSql(sql, [storyId]);
}

/**
 * Obtiene las historias activas de un usuario
 */
export async function getUserActiveStories(userId: string, currentTime: number = Date.now()): Promise<Story[]> {
  return queryDatabase<Story>(
    `SELECT * FROM stories 
     WHERE userId = ? AND expiresAt > ?
     ORDER BY createdAt DESC`,
    [userId, currentTime]
  );
}

/**
 * Obtiene todas las historias activas (no expiradas) agrupadas por usuario
 */
export async function getActiveStoriesForFeed(userId: string, currentTime: number = Date.now(), limit: number = 50): Promise<UserStories[]> {
  // Obtener userIds con historias activas (seguidos + yo mismo)
  const userStories = await queryDatabase<{ userId: string; hasUnviewedStories: number }>(
    `SELECT DISTINCT s.userId,
            MAX(CASE WHEN sv.storyId IS NULL THEN 1 ELSE 0 END) as hasUnviewedStories
     FROM stories s
     LEFT JOIN story_views sv ON s.id = sv.storyId AND sv.viewerId = ?
     WHERE s.expiresAt > ?
       AND (
         s.userId IN (SELECT followingId FROM user_follows WHERE followerId = ?)
         OR s.userId = ?
       )
     GROUP BY s.userId
     ORDER BY MAX(s.createdAt) DESC
     LIMIT ?`,
    [userId, currentTime, userId, userId, limit]
  );

  const result: UserStories[] = [];
  for (const item of userStories) {
    const user = await getUserById(item.userId);
    if (user) {
      const stories = await getUserActiveStories(item.userId, currentTime);
      result.push({
        user,
        stories,
        hasUnviewedStories: item.hasUnviewedStories === 1,
      });
    }
  }

  return result;
}

/**
 * Incrementa el contador de vistas de una historia
 */
export async function incrementStoryViewsCount(storyId: string): Promise<void> {
  const sql = `
    UPDATE stories 
    SET viewsCount = viewsCount + 1
    WHERE id = ?
  `;
  await executeSql(sql, [storyId]);
}

/**
 * Registra que un usuario vio una historia
 */
export async function recordStoryView(storyId: string, viewerId: string): Promise<void> {
  try {
    await beginTransaction();

    await executeSql(
      'INSERT OR IGNORE INTO story_views (storyId, viewerId, viewedAt) VALUES (?, ?, ?)',
      [storyId, viewerId, Date.now()]
    );

    await incrementStoryViewsCount(storyId);

    await commitTransaction();
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

/**
 * Verifica si un usuario vio una historia
 */
export async function isStoryViewed(storyId: string, viewerId: string): Promise<boolean> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM story_views WHERE storyId = ? AND viewerId = ?',
    [storyId, viewerId]
  );
  return result?.count === 1;
}

/**
 * Obtiene los usuarios que vieron una historia
 */
export async function getStoryViewers(storyId: string, limit: number = 20, offset: number = 0) {
  return queryDatabase<{ userId: string; viewedAt: number }>(
    `SELECT viewerId as userId, viewedAt FROM story_views 
     WHERE storyId = ?
     ORDER BY viewedAt DESC
     LIMIT ? OFFSET ?`,
    [storyId, limit, offset]
  );
}

/**
 * Limpia las historias expiradas
 */
export async function cleanExpiredStories(currentTime: number = Date.now()): Promise<number> {
  const q = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM stories WHERE expiresAt <= ?',
    [currentTime]
  );
  
  const count = q?.count ?? 0;
  
  if (count > 0) {
    await executeSql(
      'DELETE FROM stories WHERE expiresAt <= ?',
      [currentTime]
    );
  }

  return count;
}

/**
 * Obtiene historias que están pronto a expirar
 */
export async function getStoriesAboutToExpire(minutesThreshold: number = 60): Promise<Story[]> {
  const now = Date.now();
  const threshold = now + (minutesThreshold * 60 * 1000);
  
  return queryDatabase<Story>(
    `SELECT * FROM stories 
     WHERE expiresAt > ? AND expiresAt <= ?
     ORDER BY expiresAt ASC`,
    [now, threshold]
  );
}
