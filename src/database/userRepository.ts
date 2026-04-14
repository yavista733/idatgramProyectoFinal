/**
 * Repositorio de Usuarios
 * Maneja todas las operaciones CRUD para usuarios
 */

import { User, UserProfile } from '../types';
import { queryDatabase, queryDatabaseOne, executeSql, beginTransaction, commitTransaction, rollbackTransaction } from './sqlite';

/**
 * Obtiene un usuario por ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return queryDatabaseOne<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
}

/**
 * Obtiene un usuario por username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  return queryDatabaseOne<User>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
}

/**
 * Obtiene un usuario por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return queryDatabaseOne<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
}

/**
 * Obtiene el perfil completo de un usuario incluyendo estado de seguimiento
 */
export async function getUserProfile(userId: string, currentUserId: string): Promise<UserProfile | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const isFollowing = await isUserFollowing(currentUserId, userId);
  const isFollowedBy = await isUserFollowing(userId, currentUserId);
  const mutualFollowersCount = await getMutualFollowersCount(userId, currentUserId);

  return {
    ...user,
    isFollowing,
    isFollowedBy,
    mutualFollowersCount,
  };
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(user: User): Promise<void> {
  const sql = `
    INSERT INTO users (
      id, username, email, displayName, bio, profileImageUrl,
      followersCount, followingCount, postsCount, isVerified,
      isPrivate, website, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    user.id,
    user.username,
    user.email,
    user.displayName,
    user.bio,
    user.profileImageUrl,
    user.followersCount,
    user.followingCount,
    user.postsCount,
    user.isVerified ? 1 : 0,
    user.isPrivate ? 1 : 0,
    user.website,
    user.createdAt,
    user.updatedAt,
  ]);
}

/**
 * Actualiza un usuario
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | boolean)[] = [];

  if (updates.bio !== undefined) {
    fields.push('bio = ?');
    values.push(updates.bio);
  }
  if (updates.displayName !== undefined) {
    fields.push('displayName = ?');
    values.push(updates.displayName);
  }
  if (updates.profileImageUrl !== undefined) {
    fields.push('profileImageUrl = ?');
    values.push(updates.profileImageUrl);
  }
  if (updates.website !== undefined) {
    fields.push('website = ?');
    values.push(updates.website);
  }
  if (updates.isPrivate !== undefined) {
    fields.push('isPrivate = ?');
    values.push(updates.isPrivate ? 1 : 0);
  }
  if (updates.isVerified !== undefined) {
    fields.push('isVerified = ?');
    values.push(updates.isVerified ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updatedAt = ?');
  values.push(Date.now());
  values.push(userId);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await executeSql(sql, values);
}

/**
 * Actualiza el contador de seguidores de un usuario
 */
export async function updateUserFollowersCount(userId: string, delta: number): Promise<void> {
  const sql = `
    UPDATE users 
    SET followersCount = MAX(0, followersCount + ?), updatedAt = ?
    WHERE id = ?
  `;
  await executeSql(sql, [delta, Date.now(), userId]);
}

/**
 * Actualiza el contador de seguimiento de un usuario
 */
export async function updateUserFollowingCount(userId: string, delta: number): Promise<void> {
  const sql = `
    UPDATE users 
    SET followingCount = MAX(0, followingCount + ?), updatedAt = ?
    WHERE id = ?
  `;
  await executeSql(sql, [delta, Date.now(), userId]);
}

/**
 * Actualiza el contador de posts de un usuario
 */
export async function updateUserPostsCount(userId: string, delta: number): Promise<void> {
  const sql = `
    UPDATE users 
    SET postsCount = MAX(0, postsCount + ?), updatedAt = ?
    WHERE id = ?
  `;
  await executeSql(sql, [delta, Date.now(), userId]);
}

/**
 * Deleta un usuario
 */
export async function deleteUser(userId: string): Promise<void> {
  const sql = 'DELETE FROM users WHERE id = ?';
  await executeSql(sql, [userId]);
}

/**
 * Busca usuarios por username o displayName
 */
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  const searchTerm = `%${query}%`;
  return queryDatabase<User>(
    `SELECT * FROM users 
     WHERE username LIKE ? OR displayName LIKE ?
     ORDER BY followersCount DESC
     LIMIT ?`,
    [searchTerm, searchTerm, limit]
  );
}

/**
 * Obtiene usuarios sugeridos (no seguidos)
 */
export async function getSuggestedUsers(userId: string, limit: number = 20): Promise<User[]> {
  return queryDatabase<User>(
    `SELECT * FROM users 
     WHERE id != ? 
     AND id NOT IN (SELECT followingId FROM user_follows WHERE followerId = ?)
     ORDER BY followersCount DESC
     LIMIT ?`,
    [userId, userId, limit]
  );
}

/**
 * Verifica si un usuario sigue a otro
 */
export async function isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
  const result = await queryDatabaseOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_follows WHERE followerId = ? AND followingId = ?',
    [followerId, followingId]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Obtiene la lista de seguidores de un usuario
 */
export async function getFollowers(userId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
  return queryDatabase<User>(
    `SELECT u.* FROM users u
     JOIN user_follows uf ON u.id = uf.followerId
     WHERE uf.followingId = ?
     ORDER BY uf.createdAt DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
}

/**
 * Obtiene la lista de usuarios que sigue
 */
export async function getFollowing(userId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
  return queryDatabase<User>(
    `SELECT u.* FROM users u
     JOIN user_follows uf ON u.id = uf.followingId
     WHERE uf.followerId = ?
     ORDER BY uf.createdAt DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
}

/**
 * Sigue a un usuario
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  try {
    await beginTransaction();

    const now = Date.now();
    await executeSql(
      'INSERT INTO user_follows (followerId, followingId, createdAt) VALUES (?, ?, ?)',
      [followerId, followingId, now]
    );

    await updateUserFollowingCount(followerId, 1);
    await updateUserFollowersCount(followingId, 1);

    await commitTransaction();
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

/**
 * Deja de seguir a un usuario
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  try {
    await beginTransaction();

    await executeSql(
      'DELETE FROM user_follows WHERE followerId = ? AND followingId = ?',
      [followerId, followingId]
    );

    await updateUserFollowingCount(followerId, -1);
    await updateUserFollowersCount(followingId, -1);

    await commitTransaction();
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

/**
 * Obtiene el conteo de seguidores mutuos
 */
export async function getMutualFollowersCount(userId1: string, userId2: string): Promise<number> {
  const result = await queryDatabaseOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_follows 
     WHERE followerId IN (
       SELECT followingId FROM user_follows WHERE followerId = ?
     ) AND followingId = ?`,
    [userId1, userId2]
  );
  return result?.count ?? 0;
}

/**
 * Obtiene usuarios que sigue y que lo siguen
 */
export async function getMutualFollowers(userId: string, limit: number = 20): Promise<User[]> {
  return queryDatabase<User>(
    `SELECT u.* FROM users u
     WHERE u.id IN (
       SELECT followingId FROM user_follows WHERE followerId = ?
     ) AND u.id IN (
       SELECT followerId FROM user_follows WHERE followingId = ?
     )
     LIMIT ?`,
    [userId, userId, limit]
  );
}
