/**
 * Creates a lazy-initialized IndexedDB connection opener.
 * Caches the DB promise so subsequent calls reuse the same connection.
 */
export function createDBOpener(dbName, dbVersion, storeName) {
  let dbPromise = null

  return function openDB() {
    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        console.error(`[${dbName}] IndexedDB open error:`, req.error)
        dbPromise = null
        reject(req.error)
      }
    })
    return dbPromise
  }
}
