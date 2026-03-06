// ─── IndexedDB-backed data storage for timeline state ─────
// Stores events and timelines in IndexedDB to avoid localStorage
// quota limits (~5MB). IndexedDB typically allows 50MB+.

import { createDBOpener } from './idbHelper'

const STORE_NAME = 'state'
const DATA_KEY = 'current' // single key holding the full state object

const openDB = createDBOpener('timeliner_data', 1, STORE_NAME)

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
