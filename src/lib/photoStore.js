// ─── IndexedDB-backed photo storage ──────────────────────
// Replaces storing base64 data URLs in localStorage which hits the ~5MB quota.
// IndexedDB has much higher limits (typically 50%+ of disk space).

const DB_NAME = 'timeliner_photos'
const DB_VERSION = 1
const STORE_NAME = 'photos'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      console.error('[photoStore] IndexedDB open error:', req.error)
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

/**
 * Store a single photo by filename → dataURL.
 */
export async function putPhoto(filename, dataUrl) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(dataUrl, filename)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] putPhoto error:', err)
  }
}

/**
 * Store multiple photos at once: { filename: dataUrl, ... }
 */
export async function putPhotos(entries) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      for (const [filename, dataUrl] of Object.entries(entries)) {
        store.put(dataUrl, filename)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] putPhotos error:', err)
  }
}

/**
 * Get a single photo's dataURL by filename. Returns null if not found.
 */
export async function getPhoto(filename) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(filename)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[photoStore] getPhoto error:', err)
    return null
  }
}

/**
 * Load all photos as a { filename: dataUrl } map.
 */
export async function getAllPhotos() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.openCursor()
      const result = {}
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          result[cursor.key] = cursor.value
          cursor.continue()
        } else {
          resolve(result)
        }
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[photoStore] getAllPhotos error:', err)
    return {}
  }
}

/**
 * Remove a single photo by filename.
 */
export async function deletePhoto(filename) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(filename)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] deletePhoto error:', err)
  }
}

/**
 * Remove all photos (e.g. when clearing a timeline).
 */
export async function clearAllPhotos() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] clearAllPhotos error:', err)
  }
}

/**
 * Migrate photos from localStorage's photoMap into IndexedDB.
 * Call once on app startup. Returns the migrated map or empty object.
 */
export async function migrateFromLocalStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const photoMap = data?.photoMap
    if (!photoMap || typeof photoMap !== 'object' || Object.keys(photoMap).length === 0) return {}

    await putPhotos(photoMap)

    // Remove photoMap from localStorage to free space
    data.photoMap = {}
    localStorage.setItem(storageKey, JSON.stringify(data))

    console.log(`[photoStore] Migrated ${Object.keys(photoMap).length} photo(s) from localStorage to IndexedDB`)
    return photoMap
  } catch (err) {
    console.error('[photoStore] migration error:', err)
    return {}
  }
}
