// Resilient IndexedDB storage for long audio recordings & pending drafts
// Prevents losing any voice recording even if the browser/app is closed, refreshed, or offline!

export interface PersistedAudioDraft {
  id: string;
  audioBlob: Blob | null;
  mimeType: string;
  transcript: string;
  elapsedSeconds: number;
  updatedAt: string;
}

const DB_NAME = 'SimpleEngAudioVault';
const DB_VERSION = 1;
const STORE_DRAFTS = 'pending_drafts';
const STORE_RECORDINGS = 'saved_recordings';

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
        db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves the current in-progress or stopped audio draft to IndexedDB immediately.
 * Called every few seconds during recording and on stop/pause.
 */
export async function savePendingAudioDraft(draft: Omit<PersistedAudioDraft, 'id'>): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      store.put({
        id: 'active_day_draft',
        ...draft,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not persist draft to IndexedDB:', err);
  }
}

/**
 * Loads an unanalyzed audio draft if the user closed or refreshed the app before analysis finished.
 */
export async function loadPendingAudioDraft(): Promise<PersistedAudioDraft | null> {
  try {
    const db = await openVaultDb();
    return await new Promise<PersistedAudioDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.get('active_day_draft');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Clears the pending draft ONLY after the user explicitly discards it or after analysis is safely saved.
 */
export async function clearPendingAudioDraft(): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      store.delete('active_day_draft');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Saves the audio blob of a completed/archived entry in IndexedDB so the user can always replay or download it later.
 */
export async function saveArchivedAudioBlob(entryId: string, blob: Blob, mimeType: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDINGS);
      store.put({
        id: entryId,
        audioBlob: blob,
        mimeType,
        savedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Loads a saved recording blob by entry ID from IndexedDB.
 */
export async function loadArchivedAudioBlob(
  entryId: string
): Promise<{ audioBlob: Blob; mimeType: string } | null> {
  try {
    const db = await openVaultDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readonly');
      const store = tx.objectStore(STORE_RECORDINGS);
      const req = store.get(entryId);
      req.onsuccess = () => {
        if (req.result && req.result.audioBlob) {
          resolve({ audioBlob: req.result.audioBlob, mimeType: req.result.mimeType || 'audio/webm' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteArchivedAudioBlob(entryId: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDINGS);
      store.delete(entryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}
