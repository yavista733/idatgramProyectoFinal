/**
 * SyncService – Sincronización Bidireccional (Last Write Wins)
 * Compara updated_at (timestamp) entre local (SQLite) y remoto (Supabase)
 * - Si local es más nuevo (o remote_id es null) → POST o PATCH al remoto
 * - Si remoto es más nuevo → actualiza el local
 *
 * Usa checkRealConnectivity (fetch HEAD a google.com) en vez de NetInfo
 * Requisito del profesor: async/await exclusivamente, sin librerías externas de red
 */

import { checkRealConnectivity } from '../utils/connectivity';
import { getUnsynced, markSynced, upsertFromRemote } from '../database/postRepository';
import { getUnsyncedComments, markCommentSynced, upsertCommentFromRemote } from '../database/commentRepository';
import { getUnsyncedLikes, markLikeSynced, upsertLikeFromRemote } from '../database/likeRepository';
import { fetchPosts, uploadMany, fetchComments, uploadComment, fetchLikes, uploadLike } from './supabaseService';

/**
 * Verifica si hay conexión real a internet (fetch HEAD a google.com)
 */
export async function checkInternet(): Promise<boolean> {
  return checkRealConnectivity();
}

/**
 * Alias para compatibilidad
 */
export const isOnline = checkInternet;

// ============ POSTS ============

/**
 * PUSH: Sube posts pendientes (is_synced = 0) a Supabase
 * Last-Write-Wins: si remote_id es null → POST, si existe → PATCH con updated_at
 */
export async function syncPendingPosts(): Promise<number> {
  if (!(await isOnline())) {
    console.log('📴 Offline - Saltando sync de posts');
    return 0;
  }

  try {
    const unsyncedPosts = await getUnsynced();

    if (unsyncedPosts.length === 0) {
      console.log('✅ No hay posts pendientes de sincronizar');
      return 0;
    }

    console.log(`🔄 Sincronizando ${unsyncedPosts.length} posts...`);

    const syncedPairs = await uploadMany(unsyncedPosts);

    for (const { localId, remoteId } of syncedPairs) {
      await markSynced(localId, remoteId);
    }

    console.log(`✅ ${syncedPairs.length} posts sincronizados con remote_id`);
    return syncedPairs.length;
  } catch (error) {
    console.error('❌ Error sincronizando posts:', error);
    return 0;
  }
}

/**
 * PULL: Descarga posts remotos y usa comparación Last-Write-Wins de updated_at
 * - Si no existe localmente → insertar
 * - Si remoto es más nuevo (updated_at remoto > updated_at local) → actualizar local
 * - Si local es más nuevo → no hacer nada (se sube en el push)
 */
export async function pullRemotePosts(): Promise<number> {
  if (!(await isOnline())) {
    console.log('📴 Offline - Saltando pull de posts');
    return 0;
  }

  try {
    const remotePosts = await fetchPosts(100);

    if (remotePosts.length === 0) {
      console.log('ℹ️ No hay posts remotos para descargar');
      return 0;
    }

    console.log(`📥 Descargando ${remotePosts.length} posts remotos...`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const post of remotePosts) {
      try {
        const result = await upsertFromRemote(post);
        if (result === 'inserted') inserted++;
        else if (result === 'updated') updated++;
        else skipped++;
      } catch (e) {
        console.warn(`⚠️ Error importando post ${post.id}:`, e);
      }
    }

    console.log(`✅ Posts: ${inserted} nuevos, ${updated} actualizados, ${skipped} sin cambios`);
    return inserted + updated;
  } catch (error) {
    console.error('❌ Error descargando posts:', error);
    return 0;
  }
}

// ============ COMMENTS ============

export async function syncPendingComments(): Promise<number> {
  if (!(await isOnline())) return 0;

  try {
    const unsynced = await getUnsyncedComments();
    if (unsynced.length === 0) return 0;

    let count = 0;
    for (const comment of unsynced) {
      const remoteId = await uploadComment(comment);
      if (remoteId) {
        await markCommentSynced(comment.id, remoteId);
        count++;
      }
    }

    console.log(`✅ ${count} comentarios sincronizados`);
    return count;
  } catch (error) {
    console.error('❌ Error sincronizando comentarios:', error);
    return 0;
  }
}

// ============ LIKES ============

export async function syncPendingLikes(): Promise<number> {
  if (!(await isOnline())) return 0;

  try {
    const unsynced = await getUnsyncedLikes();
    if (unsynced.length === 0) return 0;

    let count = 0;
    for (const like of unsynced) {
      const remoteId = await uploadLike(like);
      if (remoteId) {
        await markLikeSynced(like.id, remoteId);
        count++;
      }
    }

    console.log(`✅ ${count} likes sincronizados`);
    return count;
  } catch (error) {
    console.error('❌ Error sincronizando likes:', error);
    return 0;
  }
}

// ============ SYNC COMPLETO ============

/**
 * Sincronización bidireccional completa – Last Write Wins
 * 1. Push: sube datos locales pendientes (is_synced = 0 o remote_id null)
 * 2. Pull: descarga remotos y compara updated_at
 */
export async function fullSync(): Promise<{ pushed: number; pulled: number }> {
  console.log('🔄 Iniciando sincronización bidireccional (Last Write Wins)...');

  // PUSH primero (local → remoto)
  const pushedPosts = await syncPendingPosts();
  const pushedComments = await syncPendingComments();
  const pushedLikes = await syncPendingLikes();
  const pushed = pushedPosts + pushedComments + pushedLikes;

  // PULL después (remoto → local, con comparación de updated_at)
  const pulled = await pullRemotePosts();

  console.log(`✅ Sync bidireccional completo: ${pushed} subidos, ${pulled} descargados`);

  return { pushed, pulled };
}

/**
 * Sincronización en segundo plano (llamar al iniciar la app)
 */
export async function backgroundSync(): Promise<void> {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { pushed, pulled } = await fullSync();

    if (pushed > 0 || pulled > 0) {
      console.log(`📱 Sincronización completada en background`);
    }
  } catch (error) {
    console.warn('⚠️ Background sync falló:', error);
  }
}

/**
 * Intervalo de sync automático (30 segundos por defecto)
 */
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs: number = 30000): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(async () => {
    if (await isOnline()) {
      await fullSync();
    }
  }, intervalMs);

  console.log(`🔄 Auto-sync iniciado (cada ${intervalMs / 1000}s)`);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Auto-sync detenido');
  }
}

/**
 * Alias de fullSync para compatibilidad con postsStore
 */
export async function syncPosts(): Promise<{ uploaded: number; downloaded: number }> {
  const result = await fullSync();
  return { uploaded: result.pushed, downloaded: result.pulled };
}
