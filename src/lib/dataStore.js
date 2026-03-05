// ─── IndexedDB-backed data storage for timeline state ─────
// Stores events and timelines in IndexedDB to avoid localStorage
// quota limits (~5MB). IndexedDB typically allows 50MB+.

const DB_NAME = 'timeliner_data'
const DB_VERSION = 1
const STORE_NAME = 'state'
const DATA_KEY = 'current' // single key holding the full state object

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
      console.error('[dataStore] IndexedDB open error:', req.error)
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

/**
 * Save timeline data to IndexedDB.
 * This is the primary persistence layer for heavy data (events, timelines).
 */
export async function saveData(data) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(data, DATA_KEY)
      tx.oncomplete = () => resolve({ ok: true })
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[dataStore] saveData error:', err)
    return { ok: false, error: err }
  }
}

/**
 * Load timeline data from IndexedDB.
 * Returns null if no data stored yet.
 */
export async function loadData() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(DATA_KEY)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[dataStore] loadData error:', err)
    return null
  }
}
