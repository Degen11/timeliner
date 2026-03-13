// ─── Dexie-backed data storage for timeline state ─────
// Stores events and timelines in IndexedDB via Dexie.

import db from './dexieDb'

const DATA_KEY = 'current'

/**
 * Save timeline data to IndexedDB.
 */
export async function saveData(data) {
  try {
    await db.state.put(data, DATA_KEY)
    return { ok: true }
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
    const result = await db.state.get(DATA_KEY)
    return result || null
  } catch (err) {
    console.error('[dataStore] loadData error:', err)
    return null
  }
}
