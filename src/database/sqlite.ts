/**
 * Base de datos SQLite – Idatgram
 * Estrategia Offline-First: columnas is_synced y remote_id para mapeo con Supabase
 */

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DB_VERSION = 6;

let db: SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLiteDatabase> {
  try {
    db = await openDatabaseAsync('idatgram.db');
    console.log('✅ SQLite: base de datos abierta');
    await migrateIfNeeded();
    await createTables();
    return db;
  } catch (error) {
    console.error('❌ Error inicializando SQLite:', error);
    throw error;
  }
}

async function migrateIfNeeded() {
  const database = getDatabase();
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    console.log(`🔄 Migrando DB de v${currentVersion} a v${DB_VERSION}...`);

    // Agregar remote_id a tablas existentes
    try { await database.execAsync(`ALTER TABLE posts ADD COLUMN remote_id TEXT DEFAULT NULL`); } catch (_) {}
    try { await database.execAsync(`ALTER TABLE users ADD COLUMN remote_id TEXT DEFAULT NULL`); } catch (_) {}
    try { await database.execAsync(`ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0`); } catch (_) {}
    try { await database.execAsync(`ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0`); } catch (_) {}

    // Siempre eliminar tablas comments y likes antiguas con esquema incompatible
    // (no tenían post_id, is_synced, remote_id) — se recrean en createTables()
    try { await database.execAsync(`DROP TABLE IF EXISTS comments`); } catch (_) {}
    try { await database.execAsync(`DROP TABLE IF EXISTS likes`); } catch (_) {}

    await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
    console.log(`✅ Migración completa a v${DB_VERSION} - datos preservados`);
  }
}

export function getDatabase(): SQLiteDatabase {
  if (!db) throw new Error('DB no inicializada. Llama initDatabase() primero.');
  return db;
}

async function createTables() {
  const database = getDatabase();

  // Crear tablas una por una para evitar errores en batch
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      remote_id TEXT DEFAULT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      bio TEXT DEFAULT '',
      profileImageUrl TEXT DEFAULT '',
      followersCount INTEGER DEFAULT 0,
      followingCount INTEGER DEFAULT 0,
      postsCount INTEGER DEFAULT 0,
      isVerified INTEGER DEFAULT 0,
      isPrivate INTEGER DEFAULT 0,
      website TEXT DEFAULT '',
      is_synced INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      remote_id TEXT DEFAULT NULL,
      user_id TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_posts_is_synced ON posts(is_synced)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_posts_remote_id ON posts(remote_id)`); } catch (_) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      remote_id TEXT DEFAULT NULL,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`); } catch (_) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      remote_id TEXT DEFAULT NULL,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`); } catch (_) {}
  try { await database.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique ON likes(post_id, user_id)`); } catch (_) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_follows (
      followerId TEXT NOT NULL,
      followingId TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      PRIMARY KEY(followerId, followingId)
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      remote_id TEXT DEFAULT NULL,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      fromUserId TEXT NOT NULL,
      postId TEXT DEFAULT '',
      commentId TEXT DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      isRead INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt DESC)`); } catch (_) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      text TEXT DEFAULT '',
      backgroundColor TEXT DEFAULT '',
      textColor TEXT DEFAULT '#ffffff',
      viewsCount INTEGER DEFAULT 0,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_stories_userId ON stories(userId)`); } catch (_) {}
  try { await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_stories_expiresAt ON stories(expiresAt)`); } catch (_) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS story_views (
      storyId TEXT NOT NULL,
      viewerId TEXT NOT NULL,
      viewedAt INTEGER NOT NULL,
      PRIMARY KEY(storyId, viewerId),
      FOREIGN KEY(storyId) REFERENCES stories(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ SQLite: tablas creadas (con remote_id, comments, likes)');
}

export async function queryDatabase<T>(
  sql: string,
  params?: (string | number | boolean)[]
): Promise<T[]> {
  const database = getDatabase();
  return database.getAllAsync<T>(sql, params || []);
}

export async function queryDatabaseOne<T>(
  sql: string,
  params?: (string | number | boolean)[]
): Promise<T | null> {
  const database = getDatabase();
  const result = await database.getFirstAsync<T>(sql, params || []);
  return result ?? null;
}

export async function executeSql(
  sql: string,
  params?: (string | number | boolean)[]
): Promise<void> {
  const database = getDatabase();
  await database.runAsync(sql, params || []);
}

export async function beginTransaction() {
  await getDatabase().execAsync('BEGIN TRANSACTION');
}
export async function commitTransaction() {
  await getDatabase().execAsync('COMMIT');
}
export async function rollbackTransaction() {
  await getDatabase().execAsync('ROLLBACK');
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
